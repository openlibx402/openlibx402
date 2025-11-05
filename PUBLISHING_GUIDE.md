# Publishing Guide for Java and Kotlin Packages

This guide provides step-by-step instructions for publishing OpenLibX402 Java and Kotlin packages to Maven Central.

## Table of Contents

- [Prerequisites](#prerequisites)
- [One-Time Setup](#one-time-setup)
- [Publishing Methods](#publishing-methods)
- [Manual Publishing](#manual-publishing)
- [Automated Publishing with GitHub Actions](#automated-publishing-with-github-actions)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

1. **Sonatype JIRA Account**
   - Create account at: https://issues.sonatype.org/
   - Required for claiming the `org.openlibx402` groupId

2. **GPG Key Pair**
   - Required for signing artifacts
   - Instructions below

3. **GitHub Repository Access**
   - For automated publishing via GitHub Actions

## One-Time Setup

### 1. Claim Maven Central GroupId

Create a JIRA ticket to claim the `org.openlibx402` groupId:

1. Go to https://issues.sonatype.org/
2. Click "Create" to create a new ticket
3. Fill in the form:
   - **Project**: Community Support - Open Source Project Repository Hosting (OSSRH)
   - **Issue Type**: New Project
   - **Group Id**: `org.openlibx402`
   - **Project URL**: `https://github.com/openlibx402/openlibx402`
   - **SCM URL**: `https://github.com/openlibx402/openlibx402.git`
   - **Username(s)**: Your Sonatype username(s)

4. Wait for approval (usually 1-2 business days)
5. You'll receive a comment when approved

### 2. Generate GPG Key

```bash
# Install GPG (macOS)
brew install gnupg

# Install GPG (Ubuntu/Debian)
sudo apt-get install gnupg

# Generate key pair
gpg --gen-key
# Follow prompts:
# - Real name: OpenLibX402 Team
# - Email: info@openlibx402.org
# - Passphrase: (choose a strong passphrase)

# List keys to get Key ID
gpg --list-secret-keys --keyid-format LONG

# Example output:
# sec   rsa3072/1234567890ABCDEF 2024-01-01 [SC]
#       Key ID is: 1234567890ABCDEF (last 8 chars: 90ABCDEF)

# Export public key to keyserver
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID

# Also send to other keyservers
gpg --keyserver keys.openpgp.org --send-keys YOUR_KEY_ID
gpg --keyserver pgp.mit.edu --send-keys YOUR_KEY_ID

# Export private key for GitHub Actions (base64 encoded)
gpg --export-secret-keys YOUR_KEY_ID | base64 > gpg-private-key.txt

# Export secret key ring for local use
gpg --export-secret-keys YOUR_KEY_ID > ~/.gnupg/secring.gpg
```

### 3. Configure Local Credentials

#### For Java (Maven)

Create or edit `~/.m2/settings.xml`:

```xml
<settings>
  <servers>
    <server>
      <id>ossrh</id>
      <username>YOUR_SONATYPE_USERNAME</username>
      <password>YOUR_SONATYPE_PASSWORD</password>
    </server>
  </servers>

  <profiles>
    <profile>
      <id>ossrh</id>
      <activation>
        <activeByDefault>true</activeByDefault>
      </activation>
      <properties>
        <gpg.executable>gpg</gpg.executable>
        <gpg.passphrase>YOUR_GPG_PASSPHRASE</gpg.passphrase>
      </properties>
    </profile>
  </profiles>
</settings>
```

#### For Kotlin (Gradle)

Create `packages/kotlin/gradle.properties`:

```properties
ossrhUsername=YOUR_SONATYPE_USERNAME
ossrhPassword=YOUR_SONATYPE_PASSWORD

signing.keyId=LAST_8_CHARS_OF_KEY_ID
signing.password=YOUR_GPG_PASSPHRASE
signing.secretKeyRingFile=/Users/YOUR_USERNAME/.gnupg/secring.gpg
```

**⚠️ Security Note**: Never commit these files to version control! They're already in `.gitignore`.

### 4. Configure GitHub Secrets

For automated publishing, add these secrets to your GitHub repository:

Go to: `Settings → Secrets and variables → Actions → New repository secret`

Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `OSSRH_USERNAME` | Your Sonatype username | From JIRA account |
| `OSSRH_PASSWORD` | Your Sonatype password | From JIRA account |
| `GPG_PRIVATE_KEY` | Base64-encoded private key | From `gpg-private-key.txt` |
| `GPG_KEY_ID` | Last 8 characters of key ID | From `gpg --list-secret-keys` |
| `GPG_PASSPHRASE` | GPG key passphrase | The passphrase you set |

## Publishing Methods

You can publish packages using:
1. **Manual Publishing** - Local machine, full control
2. **GitHub Actions** - Automated, triggered manually or on release

## Manual Publishing

### Publish Java Packages

```bash
cd packages/java

# Option 1: Publish to snapshots (no signing required)
cd openlibx402-core
mvn clean deploy

cd ../openlibx402-client
mvn clean deploy

# Option 2: Publish release (requires signing)
cd openlibx402-core
mvn clean deploy -P release

cd ../openlibx402-client
mvn clean deploy -P release
```

### Publish Kotlin Packages

```bash
cd packages/kotlin

# Build packages
./gradlew clean build

# Publish to Maven Central
./gradlew publish

# Or publish with verbose output
./gradlew publish --no-daemon --stacktrace
```

### Publish Individual Packages

```bash
# Java core only
cd packages/java/openlibx402-core
mvn clean deploy -P release

# Java client only
cd packages/java/openlibx402-client
mvn clean deploy -P release

# Kotlin core only
cd packages/kotlin
./gradlew :openlibx402-core:publish

# Kotlin client only
cd packages/kotlin
./gradlew :openlibx402-client:publish
```

## Automated Publishing with GitHub Actions

### Trigger Publishing Workflow

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"Publish Java and Kotlin Packages to Maven Central"** workflow
4. Click **"Run workflow"** dropdown
5. Configure options:
   - **Release type**: `snapshot` or `release`
   - **Publish Java packages**: Check to publish Java
   - **Publish Kotlin packages**: Check to publish Kotlin
6. Click **"Run workflow"**

### Workflow Options

**Snapshot Release** (Development):
- No manual release step required
- Available immediately after publishing
- URL: `https://oss.sonatype.org/content/repositories/snapshots/org/openlibx402/`
- Users need to add snapshots repository

**Production Release**:
- Requires manual release in Sonatype Nexus
- Available in Maven Central after ~2 hours
- Synced to all Maven mirrors

## Release Process

### For Snapshot Releases

```bash
# No special steps needed
# Just publish and snapshots are available immediately
```

### For Production Releases

#### Step 1: Publish to Staging

```bash
# Manual
mvn clean deploy -P release  # Java
./gradlew publish              # Kotlin

# Or use GitHub Actions
# Select "release" as release type
```

#### Step 2: Close and Release in Sonatype

1. Log in to https://oss.sonatype.org/
2. Click **"Staging Repositories"** in left menu
3. Find your repository (named like `orgopenlibx402-1001`)
4. Select it and click **"Close"**
   - Wait for validation (5-10 minutes)
   - Check **"Activity"** tab for progress
5. If validation passes, click **"Release"**
6. Confirm the release
7. Wait ~2 hours for sync to Maven Central

#### Step 3: Verify Publication

Check Maven Central Search (after ~2 hours):
```
https://search.maven.org/search?q=g:org.openlibx402
```

Direct repository check:
```
https://repo1.maven.org/maven2/org/openlibx402/openlibx402-core/
https://repo1.maven.org/maven2/org/openlibx402/openlibx402-client/
```

## Verification

### Test Local Build Before Publishing

```bash
# Java - install to local Maven repository
cd packages/java/openlibx402-core
mvn clean install

cd ../openlibx402-client
mvn clean install

# Kotlin - install to local Maven repository
cd packages/kotlin
./gradlew publishToMavenLocal

# Test in a separate project
cd /tmp
mkdir test-project
cd test-project

# Create test pom.xml or build.gradle.kts
# Add dependency and test
```

### Verify Published Artifacts

After publishing, verify the artifacts:

```bash
# Check snapshot repository
curl https://oss.sonatype.org/content/repositories/snapshots/org/openlibx402/openlibx402-core/maven-metadata.xml

# Check release repository (after release)
curl https://repo1.maven.org/maven2/org/openlibx402/openlibx402-core/maven-metadata.xml
```

### Test Installation from Maven Central

Create a test project:

**Java (Maven):**
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

**Kotlin (Gradle):**
```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

Run:
```bash
mvn clean compile  # Java
./gradlew build    # Kotlin
```

## Troubleshooting

### GPG Signing Fails

**Error**: `gpg: signing failed: Inappropriate ioctl for device`

**Solution**:
```bash
export GPG_TTY=$(tty)
echo "use-agent" >> ~/.gnupg/gpg.conf
echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf
```

### Authentication Fails

**Error**: `401 Unauthorized`

**Solution**:
- Verify credentials in `~/.m2/settings.xml` or `gradle.properties`
- Ensure Sonatype JIRA ticket was approved
- Check username and password are correct

### Validation Fails in Nexus

**Common Issues**:
1. **Missing Javadoc JAR**: Ensure Dokka/Javadoc plugin is configured
2. **Missing Sources JAR**: Check sources plugin is active
3. **Invalid POM**: Ensure all required fields present
4. **Invalid Signature**: Verify GPG key is correct

**Solution**: Check the Activity tab in Nexus for specific error messages

### Key Not Found on Keyserver

**Error**: `Key not found on keyserver`

**Solution**:
```bash
# Upload to multiple keyservers
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
gpg --keyserver keys.openpgp.org --send-keys YOUR_KEY_ID
gpg --keyserver pgp.mit.edu --send-keys YOUR_KEY_ID

# Wait 5-10 minutes for propagation
```

### Gradle Build Fails

**Error**: `Could not find method signing()`

**Solution**: Ensure `signing` plugin is applied:
```kotlin
plugins {
    signing
}
```

### Dependency Resolution Fails

**Error**: `Could not find org.openlibx402:openlibx402-core:0.1.0`

**Solutions**:
1. Check version is correct
2. For snapshots, add snapshot repository:
   ```xml
   <repositories>
       <repository>
           <id>ossrh-snapshots</id>
           <url>https://oss.sonatype.org/content/repositories/snapshots</url>
           <snapshots><enabled>true</enabled></snapshots>
       </repository>
   </repositories>
   ```
3. Wait 2 hours after release for Maven Central sync
4. Clear local Maven cache: `rm -rf ~/.m2/repository/org/openlibx402`

## Version Management

### Updating Version Numbers

Update version in these files before release:

**Java:**
- `packages/java/openlibx402-core/pom.xml` - line 9
- `packages/java/openlibx402-client/pom.xml` - line 9, 35

**Kotlin:**
- `packages/kotlin/openlibx402-core/build.gradle.kts` - line 9
- `packages/kotlin/openlibx402-client/build.gradle.kts` - line 9

### Snapshot Versions

For development snapshots, append `-SNAPSHOT`:
```xml
<version>0.2.0-SNAPSHOT</version>
```

```kotlin
version = "0.2.0-SNAPSHOT"
```

## Best Practices

1. **Test Locally First**: Always test with `mvn install` / `./gradlew publishToMavenLocal`
2. **Use Snapshots for Development**: Publish snapshots frequently
3. **Release Only Tested Versions**: Only release to production after thorough testing
4. **Tag Releases in Git**: Create git tags for each release
5. **Update Documentation**: Update README and docs with new version
6. **Announce Releases**: Update changelog and notify users
7. **Keep Secrets Secure**: Never commit credentials
8. **Verify Before Release**: Check staging repository before releasing

## Resources

- **Maven Central Guide**: https://central.sonatype.org/publish/publish-guide/
- **Sonatype Nexus**: https://oss.sonatype.org/
- **GPG Documentation**: https://www.gnupg.org/documentation/
- **Gradle Publishing**: https://docs.gradle.org/current/userguide/publishing_maven.html
- **Maven Deploy Plugin**: https://maven.apache.org/plugins/maven-deploy-plugin/

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/openlibx402/openlibx402/issues
- **Sonatype Support**: https://issues.sonatype.org/
- **Email**: info@openlibx402.org
