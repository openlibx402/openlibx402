# Publishing OpenLibX402 Kotlin Packages to Maven Central

This guide explains how to publish the OpenLibX402 Kotlin packages to Maven Central Repository using Gradle.

## Prerequisites

### 1. Create Sonatype JIRA Account

1. Go to [Sonatype JIRA](https://issues.sonatype.org/)
2. Create an account
3. Create a ticket to claim the `org.openlibx402` groupId (if not already done for Java)
   - Project: Community Support - Open Source Project Repository Hosting (OSSRH)
   - Issue Type: New Project
   - Group Id: `org.openlibx402`
   - Project URL: `https://github.com/openlibx402/openlibx402`
   - SCM URL: `https://github.com/openlibx402/openlibx402.git`

### 2. Set Up GPG

Install GPG and create a key pair:

```bash
# Install GPG (macOS)
brew install gnupg

# Install GPG (Ubuntu/Debian)
sudo apt-get install gnupg

# Generate key
gpg --gen-key

# List keys
gpg --list-keys

# Get key ID
gpg --list-secret-keys --keyid-format LONG

# Export private key
gpg --export-secret-keys KEY_ID > secring.gpg

# Distribute public key
gpg --keyserver keyserver.ubuntu.com --send-keys KEY_ID
```

### 3. Configure Gradle Properties

Create or edit `~/.gradle/gradle.properties`:

```properties
# Sonatype credentials
sonatypeUsername=YOUR_SONATYPE_USERNAME
sonatypePassword=YOUR_SONATYPE_PASSWORD

# GPG signing
signing.keyId=YOUR_KEY_ID_LAST_8_CHARS
signing.password=YOUR_GPG_PASSPHRASE
signing.secretKeyRingFile=/PATH/TO/secring.gpg

# Optional: Use GPG agent
signing.gnupg.executable=gpg
signing.gnupg.useLegacyGpg=false
signing.gnupg.keyName=YOUR_KEY_ID
```

## Prepare for Publishing

### 1. Update build.gradle.kts Files

Both core and client packages need publishing configuration:

```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    `maven-publish`
    signing
    id("org.jetbrains.dokka") version "1.9.10"
}

group = "org.openlibx402"
version = "0.1.0"

// ... dependencies ...

java {
    withJavadocJar()
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])

            pom {
                name.set("OpenLibX402 Core (Kotlin)")
                description.set("Core functionality for X402 payment protocol with Kotlin coroutines")
                url.set("https://github.com/openlibx402/openlibx402")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }

                developers {
                    developer {
                        id.set("openlibx402")
                        name.set("OpenLibX402 Team")
                        email.set("info@openlibx402.org")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/openlibx402/openlibx402.git")
                    developerConnection.set("scm:git:ssh://github.com:openlibx402/openlibx402.git")
                    url.set("https://github.com/openlibx402/openlibx402")
                }
            }
        }
    }

    repositories {
        maven {
            name = "OSSRH"
            val releasesRepoUrl = uri("https://oss.sonatype.org/service/local/staging/deploy/maven2/")
            val snapshotsRepoUrl = uri("https://oss.sonatype.org/content/repositories/snapshots/")
            url = if (version.toString().endsWith("SNAPSHOT")) snapshotsRepoUrl else releasesRepoUrl

            credentials {
                username = project.findProperty("sonatypeUsername") as String? ?: System.getenv("SONATYPE_USERNAME")
                password = project.findProperty("sonatypePassword") as String? ?: System.getenv("SONATYPE_PASSWORD")
            }
        }
    }
}

signing {
    sign(publishing.publications["maven"])
}

tasks.javadoc {
    if (JavaVersion.current().isJava9Compatible) {
        (options as StandardJavadocDocletOptions).addBooleanOption("html5", true)
    }
}
```

### 2. Configure Dokka for KDoc

In each package's `build.gradle.kts`:

```kotlin
tasks.named<org.jetbrains.dokka.gradle.DokkaTask>("dokkaHtml").configure {
    outputDirectory.set(buildDir.resolve("dokka"))
}

tasks.named<org.jetbrains.dokka.gradle.DokkaTask>("dokkaJavadoc").configure {
    outputDirectory.set(buildDir.resolve("javadoc"))
}
```

### 3. Version Management

Update version in `build.gradle.kts`:

```kotlin
version = "0.1.0"  // For release
version = "0.1.1-SNAPSHOT"  // For snapshot
```

## Publishing Process

### 1. Clean and Test

```bash
cd packages/kotlin

# Clean and test all packages
./gradlew clean test
```

### 2. Publish to Maven Central

#### Publish All Packages

```bash
./gradlew publish
```

#### Publish Individual Packages

```bash
# Core package
./gradlew :openlibx402-core:publish

# Client package
./gradlew :openlibx402-client:publish
```

### 3. Close and Release Staging Repository

```bash
# Install Nexus Staging Plugin
./gradlew publishToSonatype closeAndReleaseSonatypeStagingRepository
```

Or manually:
1. Log in to [Nexus Repository Manager](https://oss.sonatype.org/)
2. Go to "Staging Repositories"
3. Find your repository (orgopenlibx402-XXXX)
4. Click "Close" and wait for validation
5. If validation passes, click "Release"

### 4. Verify Release

After ~2 hours, check:

```bash
# Search Maven Central
https://search.maven.org/search?q=g:org.openlibx402

# Check availability
https://repo1.maven.org/maven2/org/openlibx402/openlibx402-core/0.1.0/
```

## Using Published Packages

Once published, users can add to their `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

Or in Gradle (Groovy):

```groovy
dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'
}
```

## Snapshot Releases

For development snapshots:

```bash
# Update version to X.X.X-SNAPSHOT in build.gradle.kts
./gradlew publish
```

Users can access snapshots by adding:

```kotlin
repositories {
    mavenCentral()
    maven {
        url = uri("https://oss.sonatype.org/content/repositories/snapshots/")
    }
}
```

## Automation with GitHub Actions

Create `.github/workflows/publish-kotlin.yml`:

```yaml
name: Publish Kotlin Packages to Maven Central

on:
  release:
    types: [created]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish'
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'

      - name: Grant execute permission for gradlew
        run: chmod +x packages/kotlin/gradlew

      - name: Configure GPG
        run: |
          echo "${{ secrets.GPG_PRIVATE_KEY }}" | base64 --decode | gpg --import
          echo "use-agent" >> ~/.gnupg/gpg.conf
          echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf

      - name: Create gradle.properties
        run: |
          mkdir -p ~/.gradle
          cat <<EOF > ~/.gradle/gradle.properties
          sonatypeUsername=${{ secrets.SONATYPE_USERNAME }}
          sonatypePassword=${{ secrets.SONATYPE_PASSWORD }}
          signing.keyId=${{ secrets.GPG_KEY_ID }}
          signing.password=${{ secrets.GPG_PASSPHRASE }}
          signing.secretKeyRingFile=$HOME/.gnupg/secring.gpg
          EOF

      - name: Export GPG key
        run: gpg --export-secret-keys ${{ secrets.GPG_KEY_ID }} > ~/.gnupg/secring.gpg

      - name: Publish Packages
        run: |
          cd packages/kotlin
          ./gradlew publish --no-daemon --stacktrace

      - name: Close and Release Staging Repository
        run: |
          cd packages/kotlin
          ./gradlew closeAndReleaseSonatypeStagingRepository --no-daemon
```

Add these secrets to GitHub:
- `GPG_PRIVATE_KEY` - Base64-encoded GPG private key
- `GPG_KEY_ID` - Last 8 characters of your GPG key ID
- `GPG_PASSPHRASE` - GPG key passphrase
- `SONATYPE_USERNAME` - Sonatype JIRA username
- `SONATYPE_PASSWORD` - Sonatype JIRA password

## Advanced Configuration

### Using Gradle Nexus Publish Plugin

Add to `build.gradle.kts`:

```kotlin
plugins {
    id("io.github.gradle-nexus.publish-plugin") version "1.3.0"
}

nexusPublishing {
    repositories {
        sonatype {
            nexusUrl.set(uri("https://oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://oss.sonatype.org/content/repositories/snapshots/"))
            username.set(project.findProperty("sonatypeUsername") as String?)
            password.set(project.findProperty("sonatypePassword") as String?)
        }
    }
}
```

Then publish with:

```bash
./gradlew publishToSonatype closeAndReleaseSonatypeStagingRepository
```

### Multi-Module Publishing

For the multi-module setup, add to root `build.gradle.kts`:

```kotlin
subprojects {
    apply(plugin = "maven-publish")
    apply(plugin = "signing")

    // ... publishing configuration ...
}
```

## Troubleshooting

### GPG Signing Fails

```bash
# Test GPG
echo "test" | gpg --clearsign

# List keys
gpg --list-secret-keys --keyid-format LONG

# Set passphrase in environment
export ORG_GRADLE_PROJECT_signingPassword="your-passphrase"
```

### Gradle Daemon Issues

```bash
# Stop all daemons
./gradlew --stop

# Run with --no-daemon
./gradlew publish --no-daemon
```

### Validation Errors

Common issues:
- Missing Javadoc JAR (KDoc)
- Missing sources JAR
- POM missing required metadata
- Invalid GPG signature

Check logs for specific errors:

```bash
./gradlew publish --stacktrace --info
```

### Module Metadata Issues

If using Gradle module metadata:

```kotlin
tasks.withType<GenerateModuleMetadata> {
    enabled = false
}
```

## Best Practices

1. **Versioning**: Follow [Semantic Versioning](https://semver.org/)
2. **Testing**: Always run `./gradlew test` before publishing
3. **Documentation**: Update CHANGELOG.md with each release
4. **Git Tags**: Tag releases in Git
5. **KDoc**: Maintain comprehensive KDoc documentation
6. **Security**: Never commit credentials to version control
7. **Staging**: Test in staging repository first

## Local Testing

Before publishing to Maven Central, test locally:

```bash
# Publish to local Maven repository
./gradlew publishToMavenLocal

# Use in other projects
repositories {
    mavenLocal()
}
```

## Resources

- [Maven Central Guide](https://central.sonatype.org/publish/publish-guide/)
- [Gradle Publishing Guide](https://docs.gradle.org/current/userguide/publishing_maven.html)
- [Nexus Repository Manager](https://oss.sonatype.org/)
- [Gradle Nexus Publish Plugin](https://github.com/gradle-nexus/publish-plugin)
- [Dokka Documentation](https://kotlin.github.io/dokka/)
