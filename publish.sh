#!/bin/bash

# OpenLibX402 Publishing Script
# This script helps publish Java and Kotlin packages to Maven Central

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Java
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        JAVA_MAJOR=$(echo "$JAVA_VERSION" | cut -d'.' -f1)

        # Handle both old (1.8) and new (11, 17) versioning
        if [ "$JAVA_MAJOR" == "1" ]; then
            JAVA_MAJOR=$(echo "$JAVA_VERSION" | cut -d'.' -f2)
        fi

        if [ "$JAVA_MAJOR" -ge 11 ] 2>/dev/null; then
            print_success "Java $JAVA_VERSION installed"
        else
            print_warning "Java version could not be determined or may be too old"
            print_info "Java 11 or higher required (found: $JAVA_VERSION)"
        fi
    else
        print_error "Java not found. Please install Java 11 or higher"
        exit 1
    fi

    # Check Maven
    if command -v mvn &> /dev/null; then
        print_success "Maven installed"
    else
        print_warning "Maven not found (required for Java packages)"
    fi

    # Check Gradle
    if [ -f "packages/kotlin/gradlew" ]; then
        print_success "Gradle wrapper found"
    else
        print_warning "Gradle wrapper not found (required for Kotlin packages)"
    fi

    # Check GPG
    if command -v gpg &> /dev/null; then
        print_success "GPG installed"

        # Check for GPG keys
        if gpg --list-secret-keys &> /dev/null; then
            print_success "GPG keys found"
        else
            print_warning "No GPG keys found. Run: gpg --gen-key"
        fi
    else
        print_error "GPG not found. Please install GPG"
        exit 1
    fi
}

# Test local build
test_local_build() {
    print_header "Testing Local Build"

    local TYPE=$1

    if [ "$TYPE" == "java" ] || [ "$TYPE" == "all" ]; then
        print_info "Building Java packages..."

        cd packages/java/openlibx402-core
        if mvn clean install -DskipTests; then
            print_success "Java core package built successfully"
        else
            print_error "Java core package build failed"
            exit 1
        fi

        cd ../openlibx402-client
        if mvn clean install -DskipTests; then
            print_success "Java client package built successfully"
        else
            print_error "Java client package build failed"
            exit 1
        fi

        cd ../../..
    fi

    if [ "$TYPE" == "kotlin" ] || [ "$TYPE" == "all" ]; then
        print_info "Building Kotlin packages..."

        cd packages/kotlin
        chmod +x gradlew
        if ./gradlew clean build -x test; then
            print_success "Kotlin packages built successfully"
        else
            print_error "Kotlin packages build failed"
            exit 1
        fi

        cd ../..
    fi
}

# Publish to local Maven repository
publish_local() {
    print_header "Publishing to Local Maven Repository"

    local TYPE=$1

    if [ "$TYPE" == "java" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Java packages locally..."

        cd packages/java/openlibx402-core
        mvn clean install -DskipTests
        print_success "Java core: org.openlibx402:openlibx402-core:0.1.0"

        cd ../openlibx402-client
        mvn clean install -DskipTests
        print_success "Java client: org.openlibx402:openlibx402-client:0.1.0"

        cd ../../..
    fi

    if [ "$TYPE" == "kotlin" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Kotlin packages locally..."

        cd packages/kotlin
        ./gradlew publishToMavenLocal
        print_success "Kotlin core: org.openlibx402:openlibx402-core:0.1.0"
        print_success "Kotlin client: org.openlibx402:openlibx402-client:0.1.0"

        cd ../..
    fi

    print_info "Local Maven repository: ~/.m2/repository/org/openlibx402/"
}

# Publish to Maven Central (snapshot)
publish_snapshot() {
    print_header "Publishing Snapshot to Maven Central"

    local TYPE=$1

    print_warning "This will publish snapshot versions to OSSRH"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi

    if [ "$TYPE" == "java" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Java packages..."

        cd packages/java/openlibx402-core
        mvn clean deploy -DskipTests
        print_success "Java core published"

        cd ../openlibx402-client
        mvn clean deploy -DskipTests
        print_success "Java client published"

        cd ../../..
    fi

    if [ "$TYPE" == "kotlin" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Kotlin packages..."

        cd packages/kotlin
        ./gradlew publish --no-daemon
        print_success "Kotlin packages published"

        cd ../..
    fi

    print_success "Snapshots published to: https://oss.sonatype.org/content/repositories/snapshots/org/openlibx402/"
}

# Publish to Maven Central (release)
publish_release() {
    print_header "Publishing Release to Maven Central"

    local TYPE=$1

    print_warning "This will publish release versions to Maven Central"
    print_warning "You will need to manually release in Sonatype Nexus after this"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi

    if [ "$TYPE" == "java" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Java packages..."

        cd packages/java/openlibx402-core
        mvn clean deploy -P release -DskipTests
        print_success "Java core published"

        cd ../openlibx402-client
        mvn clean deploy -P release -DskipTests
        print_success "Java client published"

        cd ../../..
    fi

    if [ "$TYPE" == "kotlin" ] || [ "$TYPE" == "all" ]; then
        print_info "Publishing Kotlin packages..."

        cd packages/kotlin
        ./gradlew publish --no-daemon
        print_success "Kotlin packages published"

        cd ../..
    fi

    print_success "Release artifacts published to staging repository"
    print_info ""
    print_info "Next steps:"
    print_info "1. Log in to https://oss.sonatype.org/"
    print_info "2. Go to 'Staging Repositories'"
    print_info "3. Find repository orgopenlibx402-XXXX"
    print_info "4. Click 'Close' and wait for validation"
    print_info "5. Click 'Release' to publish to Maven Central"
    print_info "6. Wait ~2 hours for sync"
}

# Show usage
show_usage() {
    echo "Usage: ./publish.sh [command] [type]"
    echo ""
    echo "Commands:"
    echo "  check           Check prerequisites"
    echo "  test            Test local build"
    echo "  local           Publish to local Maven repository"
    echo "  snapshot        Publish snapshot to Maven Central"
    echo "  release         Publish release to Maven Central"
    echo "  help            Show this help message"
    echo ""
    echo "Types:"
    echo "  java            Java packages only"
    echo "  kotlin          Kotlin packages only"
    echo "  all             Both Java and Kotlin (default)"
    echo ""
    echo "Examples:"
    echo "  ./publish.sh check"
    echo "  ./publish.sh test java"
    echo "  ./publish.sh local all"
    echo "  ./publish.sh snapshot kotlin"
    echo "  ./publish.sh release all"
}

# Main script
main() {
    local COMMAND=${1:-help}
    local TYPE=${2:-all}

    # Validate type
    if [ "$TYPE" != "java" ] && [ "$TYPE" != "kotlin" ] && [ "$TYPE" != "all" ]; then
        print_error "Invalid type: $TYPE"
        show_usage
        exit 1
    fi

    case $COMMAND in
        check)
            check_prerequisites
            ;;
        test)
            check_prerequisites
            test_local_build "$TYPE"
            ;;
        local)
            check_prerequisites
            test_local_build "$TYPE"
            publish_local "$TYPE"
            ;;
        snapshot)
            check_prerequisites
            test_local_build "$TYPE"
            publish_snapshot "$TYPE"
            ;;
        release)
            check_prerequisites
            test_local_build "$TYPE"
            publish_release "$TYPE"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac

    print_success "Done!"
}

# Run main
main "$@"
