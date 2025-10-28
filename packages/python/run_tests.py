#!/usr/bin/env python3
"""
OpenLibx402 Test Runner

Automatically runs all tests across packages and generates a report.
"""

import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


class Colors:
    """ANSI color codes for terminal output"""

    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


@dataclass
class PackageTestResult:
    """Container for results from running a package's test suite."""

    package: str
    success: bool
    count: int = 0
    duration: float = 0.0
    stats: Dict[str, int] = field(default_factory=dict)
    summary: str = ""
    stdout: str = ""
    stderr: str = ""


class TestRunner:
    """Test runner for OpenLibx402 packages"""

    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.packages_dir = self.root_dir / "packages" / "python"
        self.available_packages = self.discover_packages()
        self.results: List[PackageTestResult] = []

    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}{text}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}\n")

    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

    def print_error(self, text: str):
        """Print error message"""
        print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

    def print_info(self, text: str):
        """Print info message"""
        print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

    def discover_packages(self) -> List[str]:
        """Return sorted list of Python package names under packages/python"""
        if not self.packages_dir.exists():
            return []

        packages = [
            path.name
            for path in self.packages_dir.iterdir()
            if path.is_dir() and (path / "pyproject.toml").exists()
        ]
        return sorted(packages)

    def parse_pytest_summary(self, stdout: str) -> PackageTestResult:
        """Extract summary information from pytest output"""
        summary_line = ""
        for line in reversed(stdout.splitlines()):
            line = line.strip()
            if line.startswith("=") and " in " in line:
                summary_line = line
                break

        if not summary_line:
            return PackageTestResult(package="", success=True, summary="")

        body = summary_line.strip("= ").strip()
        stats_part, _, timing_part = body.partition(" in ")

        stats: Dict[str, int] = {}
        total_tests = 0

        for chunk in stats_part.split(","):
            match = re.search(r"(?P<count>\d+)\s+(?P<label>[a-zA-Z_]+)", chunk.strip())
            if not match:
                continue
            count = int(match.group("count"))
            label = match.group("label")
            stats[label] = stats.get(label, 0) + count
            if label not in {"warning", "warnings"}:
                total_tests += count

        duration = 0.0
        timing_match = re.search(r"([0-9]*\.?[0-9]+)", timing_part)
        if timing_match:
            try:
                duration = float(timing_match.group(1))
            except ValueError:
                duration = 0.0

        return PackageTestResult(
            package="",
            success=True,
            count=total_tests,
            duration=duration,
            stats=stats,
            summary=body,
        )

    def format_stats(self, stats: Dict[str, int]) -> str:
        """Render pytest status counts in a compact human-readable form"""
        if not stats:
            return "no tests collected"

        ordered = ["passed", "failed", "error", "skipped", "xfailed", "xpassed"]
        pieces = []

        for key in ordered:
            if key in stats:
                pieces.append(f"{stats[key]} {key}")

        remaining = [
            f"{count} {label}" for label, count in stats.items() if label not in ordered
        ]
        pieces.extend(sorted(remaining))

        return ", ".join(pieces)

    def run_package_tests(
        self,
        package_name: str,
        pytest_args: Optional[List[str]] = None,
        show_output: bool = False,
    ) -> PackageTestResult:
        """
        Run tests for a specific package

        Returns:
            (success, test_count, duration)
        """
        package_dir = self.packages_dir / package_name
        tests_dir = package_dir / "tests"

        if not tests_dir.exists():
            self.print_warning(f"No tests directory found for {package_name}")
            return PackageTestResult(
                package=package_name, success=True, summary="no tests directory"
            )

        print(f"\n{Colors.BOLD}Testing: {package_name}{Colors.ENDC}")
        print(f"Location: {package_dir}")

        # Run pytest
        start_time = time.time()
        pytest_cmd = [
            sys.executable,
            "-m",
            "pytest",
            str(tests_dir),
            "-v",
            "--tb=short",
        ]
        if pytest_args:
            pytest_cmd.extend(pytest_args)

        try:
            result = subprocess.run(
                pytest_cmd, cwd=package_dir, capture_output=True, text=True
            )
            duration = time.time() - start_time
            summary = self.parse_pytest_summary(result.stdout)
            summary.package = package_name
            summary.duration = duration
            summary.stdout = result.stdout
            summary.stderr = result.stderr
            summary.success = result.returncode == 0
            if not summary.success and not summary.summary and summary.stderr:
                summary.summary = summary.stderr.strip().splitlines()[-1]

            if summary.success:
                if show_output and summary.stdout:
                    print(summary.stdout)
                if show_output and summary.stderr:
                    sys.stderr.write(summary.stderr)
                stats_text = self.format_stats(summary.stats)
                self.print_success(f"{package_name}: {stats_text} in {duration:.2f}s")
            else:
                self.print_error(f"{package_name}: Tests failed")
                print(summary.stdout)
                if summary.stderr:
                    sys.stderr.write(summary.stderr)

            return summary

        except Exception as e:
            self.print_error(f"{package_name}: Error running tests - {e}")
            return PackageTestResult(
                package=package_name, success=False, summary=str(e)
            )

    def run_all_tests(
        self,
        packages: Optional[List[str]] = None,
        pytest_args: Optional[List[str]] = None,
        show_output: bool = False,
    ):
        """Run tests for all packages or specified packages"""
        if packages is None:
            packages = list(self.available_packages)
        else:
            # Preserve order and drop duplicates
            seen = set()
            packages = [pkg for pkg in packages if not (pkg in seen or seen.add(pkg))]

        if not packages:
            self.print_warning("No packages available to test.")
            return 0

        unknown = [pkg for pkg in packages if pkg not in self.available_packages]
        if unknown:
            self.print_warning(f"Skipping unknown package(s): {', '.join(unknown)}")
            packages = [pkg for pkg in packages if pkg not in unknown]

        if not packages:
            self.print_warning("No valid packages selected for testing.")
            return 0

        self.print_header("🧪 OpenLibx402 Test Runner")

        self.results = []
        total_tests = 0
        total_time = 0.0
        all_passed = True

        for package in packages:
            result = self.run_package_tests(
                package, pytest_args=pytest_args, show_output=show_output
            )
            self.results.append(result)
            total_tests += result.count
            total_time += result.duration
            if not result.success:
                all_passed = False

        if not self.results:
            self.print_warning("No tests executed.")
            return 1

        # Print summary
        self.print_header("📊 Test Summary")

        print(f"\n{'Package':<25} {'Tests':<10} {'Status':<10} {'Time':<10} Summary")
        print("-" * 90)

        for result in self.results:
            status = (
                f"{Colors.OKGREEN}PASS{Colors.ENDC}"
                if result.success
                else f"{Colors.FAIL}FAIL{Colors.ENDC}"
            )
            summary_text = (
                self.format_stats(result.stats) if result.stats else result.summary
            )
            if not summary_text:
                summary_text = "-"
            print(
                f"{result.package:<25} {result.count:<10} {status:<10} "
                f"{result.duration:.2f}s   {summary_text}"
            )

        print("-" * 90)
        print(f"{'TOTAL':<25} {total_tests:<10} {'':<10} {total_time:.2f}s\n")

        if all_passed:
            self.print_success(f"All {total_tests} tests passed in {total_time:.2f}s")
            self.print_header("🎉 ALL TESTS PASSED")
            return 0

        self.print_error("Some tests failed")
        self.print_header("❌ TESTS FAILED")
        return 1

    def check_dependencies(self):
        """Check if required dependencies are installed"""
        self.print_header("🔍 Checking Dependencies")

        required = ["pytest", "pytest-asyncio"]
        missing = []

        for package in required:
            try:
                __import__(package.replace("-", "_"))
                self.print_success(f"{package} is installed")
            except ImportError:
                missing.append(package)
                self.print_error(f"{package} is NOT installed")

        if missing:
            self.print_warning(
                f"Install missing packages: pip install {' '.join(missing)}"
            )
            return False

        return True

    def install_packages(self, packages: Optional[List[str]] = None):
        """Install packages in development mode"""
        self.print_header("📦 Installing Packages")

        if packages is None:
            packages = list(self.available_packages)

        for package in packages:
            package_dir = self.packages_dir / package
            if package_dir.exists():
                print(f"\nInstalling {package}...")
                try:
                    subprocess.run(
                        [
                            sys.executable,
                            "-m",
                            "pip",
                            "install",
                            "-e",
                            str(package_dir),
                            "-q",
                        ],
                        check=True,
                    )
                    self.print_success(f"{package} installed")
                except subprocess.CalledProcessError as e:
                    self.print_error(f"Failed to install {package}: {e}")
            else:
                self.print_warning(f"Package directory not found: {package}")


def main():
    """Main entry point"""
    runner = TestRunner()

    # Parse command line arguments
    import argparse

    parser = argparse.ArgumentParser(description="Run OpenLibx402 tests")
    parser.add_argument(
        "--package",
        "-p",
        dest="packages",
        action="append",
        help="Limit test run to specific package(s). "
        "Use multiple times or comma-separated values. Defaults to all.",
    )
    parser.add_argument(
        "--install", "-i", help="Install packages before testing", action="store_true"
    )
    parser.add_argument(
        "--check-deps", help="Only check dependencies", action="store_true"
    )
    parser.add_argument(
        "--list-packages", help="List discovered packages and exit", action="store_true"
    )
    parser.add_argument(
        "--show-output",
        help="Display pytest output even when tests pass",
        action="store_true",
    )
    parser.add_argument(
        "--pytest-args",
        nargs=argparse.REMAINDER,
        help="Additional arguments passed to pytest. "
        "Use '--pytest-args -- <args>' to forward options.",
    )

    args = parser.parse_args()

    if args.list_packages:
        runner.print_header("📦 Available Packages")
        if not runner.available_packages:
            runner.print_warning("No packages discovered under packages/python.")
        else:
            for package in runner.available_packages:
                print(f"- {package}")
        return 0

    selected_packages: Optional[List[str]] = None
    if args.packages:
        collected: List[str] = []
        for entry in args.packages:
            collected.extend(part.strip() for part in entry.split(",") if part.strip())

        if collected:
            if any(name.lower() == "all" for name in collected):
                selected_packages = None
            else:
                missing = sorted(set(collected) - set(runner.available_packages))
                if missing:
                    runner.print_error(f"Unknown package(s): {', '.join(missing)}")
                    return 1
                selected_packages = collected

    # Check dependencies
    if args.check_deps:
        deps_ok = runner.check_dependencies()
        return 0 if deps_ok else 1

    # Install packages if requested
    if args.install:
        runner.install_packages(selected_packages)

    # Determine which packages to test
    packages = selected_packages

    # Run tests
    exit_code = runner.run_all_tests(
        packages,
        pytest_args=args.pytest_args,
        show_output=args.show_output,
    )

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
