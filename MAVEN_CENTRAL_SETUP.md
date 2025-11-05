# Maven Central Publishing Setup Complete ✅

The Java and Kotlin packages are now ready for publishing to Maven Central!

## What Was Configured

### 1. Java Packages (Maven)

**Updated Files:**
- [packages/java/openlibx402-core/pom.xml](packages/java/openlibx402-core/pom.xml)
- [packages/java/openlibx402-client/pom.xml](packages/java/openlibx402-client/pom.xml)

**Configuration Added:**
- ✅ Maven Central distribution management
- ✅ Developer information
- ✅ SCM (Source Control Management) details
- ✅ GPG signing plugin for artifact signing
- ✅ Nexus staging plugin for deployment
- ✅ Javadoc generation
- ✅ Sources JAR generation
- ✅ Release profile for production releases

### 2. Kotlin Packages (Gradle)

**Updated Files:**
- [packages/kotlin/openlibx402-core/build.gradle.kts](packages/kotlin/openlibx402-core/build.gradle.kts)
- [packages/kotlin/openlibx402-client/build.gradle.kts](packages/kotlin/openlibx402-client/build.gradle.kts)

**Configuration Added:**
- ✅ Signing plugin for GPG signatures
- ✅ Maven Central repository configuration
- ✅ Developer information
- ✅ SCM details
- ✅ Dokka (KDoc) JAR generation
- ✅ Sources JAR generation
- ✅ Credential management from environment variables

### 3. GitHub Actions Workflow

**Created:**
- [.github/workflows/publish-java-kotlin.yml](.github/workflows/publish-java-kotlin.yml)

**Features:**
- ✅ Manual workflow trigger with options
- ✅ Separate jobs for Java and Kotlin
- ✅ Automatic GPG key setup
- ✅ Configurable release types (snapshot/release)
- ✅ Build status reporting
- ✅ Post-publish verification steps

### 4. Documentation

**Created:**
- [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) - Comprehensive publishing guide
- [publish.sh](publish.sh) - Automated publishing script
- [MAVEN_CENTRAL_SETUP.md](MAVEN_CENTRAL_SETUP.md) - This file

## Quick Start

### Prerequisites Setup

Before you can publish, you need to complete one-time setup:

#### 1. Create Sonatype JIRA Account
```
URL: https://issues.sonatype.org/
Create a ticket to claim: org.openlibx402
```

#### 2. Generate GPG Key
```bash
gpg --gen-key
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
```

#### 3. Configure Local Credentials

**For Maven (~/.m2/settings.xml):**
```xml
<servers>
  <server>
    <id>ossrh</id>
    <username>YOUR_SONATYPE_USERNAME</username>
    <password>YOUR_SONATYPE_PASSWORD</password>
  </server>
</servers>
```

**For Gradle (packages/kotlin/gradle.properties):**
```properties
ossrhUsername=YOUR_SONATYPE_USERNAME
ossrhPassword=YOUR_SONATYPE_PASSWORD
signing.keyId=YOUR_KEY_ID
signing.password=YOUR_GPG_PASSPHRASE
```

#### 4. Configure GitHub Secrets

Add these secrets to GitHub repository settings:
- `OSSRH_USERNAME`
- `OSSRH_PASSWORD`
- `GPG_PRIVATE_KEY` (base64-encoded)
- `GPG_KEY_ID`
- `GPG_PASSPHRASE`

## Publishing Methods

### Method 1: Using the Publish Script (Recommended for Local)

```bash
# Check prerequisites
./publish.sh check

# Test build locally
./publish.sh test all

# Publish to local Maven repository (for testing)
./publish.sh local all

# Publish snapshot to Maven Central
./publish.sh snapshot all

# Publish release to Maven Central
./publish.sh release all
```

### Method 2: Manual Commands

**Java:**
```bash
# Snapshot
cd packages/java/openlibx402-core
mvn clean deploy

# Release
mvn clean deploy -P release
```

**Kotlin:**
```bash
cd packages/kotlin
./gradlew publish
```

### Method 3: GitHub Actions (Recommended for CI/CD)

1. Go to **Actions** tab in GitHub
2. Select **"Publish Java and Kotlin Packages to Maven Central"**
3. Click **"Run workflow"**
4. Choose options:
   - Release type: `snapshot` or `release`
   - Select packages to publish
5. Monitor the workflow execution

## Package Coordinates

Once published, users can add these dependencies:

### Java (Maven)

```xml
<dependencies>
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-core</artifactId>
        <version>0.1.0</version>
    </dependency>
    <dependency>
        <groupId>org.openlibx402</groupId>
        <artifactId>openlibx402-client</artifactId>
        <version>0.1.0</version>
    </dependency>
</dependencies>
```

### Kotlin (Gradle)

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

## Release Process

### For Snapshot Releases

1. Publish using any method above
2. Snapshots are immediately available at:
   ```
   https://oss.sonatype.org/content/repositories/snapshots/org/openlibx402/
   ```

### For Production Releases

1. **Publish to Staging:**
   ```bash
   ./publish.sh release all
   ```

2. **Release in Sonatype Nexus:**
   - Log in to https://oss.sonatype.org/
   - Go to "Staging Repositories"
   - Find `orgopenlibx402-XXXX`
   - Click "Close" → Wait for validation
   - Click "Release"

3. **Verify Publication** (after ~2 hours):
   ```
   https://search.maven.org/search?q=g:org.openlibx402
   ```

## Verification

### Test Local Installation

```bash
# Install to local repository
./publish.sh local all

# Verify location
ls ~/.m2/repository/org/openlibx402/

# Test in a project
# Create test pom.xml or build.gradle.kts with dependencies
mvn compile  # or ./gradlew build
```

### Test Published Packages

Create a new test project and add dependencies:

```bash
mkdir test-project
cd test-project

# Create pom.xml or build.gradle.kts
# Add openlibx402 dependencies
# Run build

mvn compile  # Java
./gradlew build  # Kotlin
```

## URLs and Resources

| Resource | URL |
|----------|-----|
| **Maven Central Search** | https://search.maven.org/search?q=g:org.openlibx402 |
| **OSSRH Nexus** | https://oss.sonatype.org/ |
| **Snapshots Repository** | https://oss.sonatype.org/content/repositories/snapshots/org/openlibx402/ |
| **Release Repository** | https://repo1.maven.org/maven2/org/openlibx402/ |
| **Sonatype JIRA** | https://issues.sonatype.org/ |
| **Publishing Guide** | [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) |

## Troubleshooting

### Common Issues

1. **GPG Signing Fails**
   - Ensure GPG key is generated and exported
   - Check passphrase in configuration
   - Export GPG_TTY: `export GPG_TTY=$(tty)`

2. **Authentication Fails**
   - Verify Sonatype credentials
   - Check JIRA ticket was approved
   - Ensure settings.xml or gradle.properties is correct

3. **Validation Fails in Nexus**
   - Check Javadoc/Dokka JAR is present
   - Verify sources JAR is included
   - Ensure POM has all required fields
   - Validate GPG signatures

4. **Key Not Found on Keyserver**
   - Upload to multiple keyservers
   - Wait 5-10 minutes for propagation

### Getting Help

- **Detailed Guide**: [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md)
- **GitHub Issues**: https://github.com/openlibx402/openlibx402/issues
- **Sonatype Support**: https://issues.sonatype.org/

## Next Steps

1. ✅ **Complete One-Time Setup**
   - Create Sonatype account and claim groupId
   - Generate and distribute GPG key
   - Configure local credentials
   - Set up GitHub secrets

2. ✅ **Test Locally**
   - Run `./publish.sh test all`
   - Publish to local Maven: `./publish.sh local all`
   - Test in a separate project

3. ✅ **Publish Snapshot**
   - Test with snapshot first: `./publish.sh snapshot all`
   - Verify snapshot is accessible

4. ✅ **Publish First Release**
   - When ready: `./publish.sh release all`
   - Complete Nexus release process
   - Verify on Maven Central after 2 hours

5. ✅ **Announce Release**
   - Update main README with installation instructions
   - Create GitHub release with changelog
   - Notify users and update documentation

## Package Information

| Package | Group ID | Artifact ID | Current Version |
|---------|----------|-------------|----------------|
| Java Core | org.openlibx402 | openlibx402-core | 0.1.0 |
| Java Client | org.openlibx402 | openlibx402-client | 0.1.0 |
| Kotlin Core | org.openlibx402 | openlibx402-core | 0.1.0 |
| Kotlin Client | org.openlibx402 | openlibx402-client | 0.1.0 |

**Note**: Kotlin packages use the same artifact IDs as Java packages. Maven/Gradle will select the correct variant based on your project configuration.

## Status: Ready to Publish! 🚀

All configuration is complete. Once you complete the one-time setup (Sonatype account, GPG key, credentials), you can publish packages using any of the methods above.

For detailed instructions, see [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md).
