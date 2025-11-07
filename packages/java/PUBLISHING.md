# Publishing OpenLibX402 Java Packages to Maven Central

This guide explains how to publish the OpenLibX402 Java packages to Maven Central Repository.

## Prerequisites

### 1. Create Sonatype JIRA Account

1. Go to [Sonatype JIRA](https://issues.sonatype.org/)
2. Create an account
3. Create a ticket to claim the `org.openlibx402` groupId
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

# Distribute public key to key server
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
```

### 3. Configure Maven Settings

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

## Prepare for Publishing

### 1. Update POM Files

Both `openlibx402-core/pom.xml` and `openlibx402-client/pom.xml` need:

```xml
<project>
    <!-- ... -->

    <name>OpenLibX402 Core</name>
    <description>Core functionality for X402 payment protocol</description>
    <url>https://github.com/openlibx402/openlibx402</url>

    <licenses>
        <license>
            <name>MIT License</name>
            <url>https://opensource.org/licenses/MIT</url>
        </license>
    </licenses>

    <developers>
        <developer>
            <name>OpenLibX402 Team</name>
            <email>info@openlibx402.org</email>
            <organization>OpenLibX402</organization>
            <organizationUrl>https://openlibx402.org</organizationUrl>
        </developer>
    </developers>

    <scm>
        <connection>scm:git:git://github.com/openlibx402/openlibx402.git</connection>
        <developerConnection>scm:git:ssh://github.com:openlibx402/openlibx402.git</developerConnection>
        <url>https://github.com/openlibx402/openlibx402/tree/main</url>
    </scm>

    <distributionManagement>
        <snapshotRepository>
            <id>ossrh</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots</url>
        </snapshotRepository>
        <repository>
            <id>ossrh</id>
            <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
        </repository>
    </distributionManagement>

    <build>
        <plugins>
            <!-- Source plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.3.0</version>
                <executions>
                    <execution>
                        <id>attach-sources</id>
                        <goals>
                            <goal>jar-no-fork</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Javadoc plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-javadoc-plugin</artifactId>
                <version>3.6.0</version>
                <executions>
                    <execution>
                        <id>attach-javadocs</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- GPG plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-gpg-plugin</artifactId>
                <version>3.1.0</version>
                <executions>
                    <execution>
                        <id>sign-artifacts</id>
                        <phase>verify</phase>
                        <goals>
                            <goal>sign</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Nexus staging plugin -->
            <plugin>
                <groupId>org.sonatype.plugins</groupId>
                <artifactId>nexus-staging-maven-plugin</artifactId>
                <version>1.6.13</version>
                <extensions>true</extensions>
                <configuration>
                    <serverId>ossrh</serverId>
                    <nexusUrl>https://oss.sonatype.org/</nexusUrl>
                    <autoReleaseAfterClose>true</autoReleaseAfterClose>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2. Version Management

Update version in both POM files:

```xml
<version>0.1.0</version>  <!-- For release -->
<version>0.1.1-SNAPSHOT</version>  <!-- For snapshot -->
```

## Publishing Process

### 1. Clean and Test

```bash
cd packages/java

# Test core package
cd openlibx402-core
mvn clean test

# Test client package
cd ../openlibx402-client
mvn clean test
```

### 2. Deploy to Maven Central

#### Deploy Core Package

```bash
cd openlibx402-core
mvn clean deploy -P release
```

#### Deploy Client Package

```bash
cd ../openlibx402-client
mvn clean deploy -P release
```

### 3. Release from Staging

1. Log in to [Nexus Repository Manager](https://oss.sonatype.org/)
2. Go to "Staging Repositories"
3. Find your repository (orgopenlibx402-XXXX)
4. Click "Close" and wait for validation
5. If validation passes, click "Release"

**Note:** With `autoReleaseAfterClose=true`, the release is automatic.

### 4. Verify Release

After ~2 hours, check:

```bash
# Search Maven Central
https://search.maven.org/search?q=g:org.openlibx402

# Check availability
https://repo1.maven.org/maven2/org/openlibx402/openlibx402-core/0.1.0/
```

## Using Published Packages

Once published, users can add to their `pom.xml`:

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

## Snapshot Releases

For development snapshots:

```bash
# Update version to X.X.X-SNAPSHOT
mvn clean deploy
```

Users can access snapshots by adding:

```xml
<repositories>
    <repository>
        <id>ossrh-snapshots</id>
        <url>https://oss.sonatype.org/content/repositories/snapshots</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
</repositories>
```

## Automation with GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to Maven Central

on:
  release:
    types: [created]

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

      - name: Configure GPG
        run: |
          echo "${{ secrets.GPG_PRIVATE_KEY }}" | base64 --decode | gpg --import
          echo "use-agent" >> ~/.gnupg/gpg.conf
          echo "pinentry-mode loopback" >> ~/.gnupg/gpg.conf

      - name: Configure Maven
        run: |
          mkdir -p ~/.m2
          echo "${{ secrets.MAVEN_SETTINGS }}" > ~/.m2/settings.xml

      - name: Publish Core
        run: |
          cd packages/java/openlibx402-core
          mvn clean deploy -P release

      - name: Publish Client
        run: |
          cd packages/java/openlibx402-client
          mvn clean deploy -P release
```

Add these secrets to GitHub:
- `GPG_PRIVATE_KEY` - Base64-encoded GPG private key
- `MAVEN_SETTINGS` - Base64-encoded settings.xml with credentials

## Troubleshooting

### GPG Signing Fails

```bash
# Test GPG
gpg --armor --detach-sign pom.xml

# Set passphrase in environment
export GPG_PASSPHRASE="your-passphrase"
```

### Validation Errors

Common issues:
- Missing Javadoc JAR
- Missing sources JAR
- POM missing required metadata
- Invalid GPG signature

Check logs in Nexus UI for specific errors.

### Deployment Timeout

Increase timeout:

```xml
<plugin>
    <groupId>org.sonatype.plugins</groupId>
    <artifactId>nexus-staging-maven-plugin</artifactId>
    <configuration>
        <stagingProgressTimeoutMinutes>15</stagingProgressTimeoutMinutes>
    </configuration>
</plugin>
```

## Best Practices

1. **Versioning**: Follow [Semantic Versioning](https://semver.org/)
2. **Testing**: Always run full test suite before publishing
3. **Documentation**: Update CHANGELOG.md with each release
4. **Git Tags**: Tag releases in Git
5. **Security**: Never commit credentials to version control
6. **Staging**: Test in staging repository first

## Resources

- [Maven Central Guide](https://central.sonatype.org/publish/publish-guide/)
- [Nexus Repository Manager](https://oss.sonatype.org/)
- [GPG Documentation](https://www.gnupg.org/documentation/)
- [Maven Deployment Guide](https://maven.apache.org/guides/mini/guide-central-repository-upload.html)
