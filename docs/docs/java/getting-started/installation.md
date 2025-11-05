# Java Installation Guide

This guide walks you through installing and setting up the OpenLibX402 Java SDK.

## Prerequisites

### Java Development Kit (JDK)

OpenLibX402 requires Java 11 or higher.

#### macOS

```bash
# Using Homebrew
brew install openjdk@11

# Or use SDKMAN!
curl -s "https://get.sdkman.io" | bash
sdk install java 11.0.20-tem
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install openjdk-11-jdk
```

#### Windows

Download and install from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [Adoptium](https://adoptium.net/).

#### Verify Installation

```bash
java -version
# Should show: openjdk version "11.0.x" or higher

javac -version
# Should show: javac 11.0.x or higher
```

### Build Tool

Choose either Maven or Gradle.

#### Maven

**macOS:**
```bash
brew install maven
```

**Ubuntu/Debian:**
```bash
sudo apt-get install maven
```

**Windows:**
Download from [Maven's website](https://maven.apache.org/download.cgi) and add to PATH.

**Verify:**
```bash
mvn -version
# Should show: Apache Maven 3.6.x or higher
```

#### Gradle

**macOS:**
```bash
brew install gradle
```

**Ubuntu/Debian:**
```bash
sdk install gradle 8.4
```

**Windows:**
Download from [Gradle's website](https://gradle.org/install/) and add to PATH.

**Verify:**
```bash
gradle -version
# Should show: Gradle 7.x or higher
```

## Installation Methods

### Option 1: Maven (Recommended)

Add to your `pom.xml`:

```xml
<project>
    <dependencies>
        <!-- Core package -->
        <dependency>
            <groupId>org.openlibx402</groupId>
            <artifactId>openlibx402-core</artifactId>
            <version>0.1.0</version>
        </dependency>

        <!-- Client package -->
        <dependency>
            <groupId>org.openlibx402</groupId>
            <artifactId>openlibx402-client</artifactId>
            <version>0.1.0</version>
        </dependency>
    </dependencies>
</project>
```

Install dependencies:

```bash
mvn clean install
```

### Option 2: Gradle (Kotlin DSL)

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")
}
```

### Option 3: Gradle (Groovy DSL)

Add to your `build.gradle`:

```groovy
dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'
}
```

Install dependencies:

```bash
gradle build
```

### Option 4: Local Installation (Development)

For local development or testing unreleased versions:

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install core package
cd packages/java/openlibx402-core
mvn clean install

# Install client package
cd ../openlibx402-client
mvn clean install
```

Then use in your project with the same Maven/Gradle configuration as above.

## Quick Start

### Create a New Maven Project

```bash
mvn archetype:generate \
    -DgroupId=com.example \
    -DartifactId=my-x402-app \
    -DarchetypeArtifactId=maven-archetype-quickstart \
    -DarchetypeVersion=1.4 \
    -DinteractiveMode=false

cd my-x402-app
```

Edit `pom.xml` to add OpenLibX402 dependencies:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>my-x402-app</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- OpenLibX402 -->
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
</project>
```

### Create Your First Application

Create `src/main/java/com/example/App.java`:

```java
package com.example;

import org.openlibx402.client.X402AutoClient;
import org.p2p.solanaj.core.Account;
import okhttp3.Response;

public class App {
    public static void main(String[] args) {
        // Create Solana account
        Account account = new Account();
        System.out.println("Public Key: " + account.getPublicKey());

        // Create client
        try (X402AutoClient client = new X402AutoClient.Builder(account)
            .rpcUrl("https://api.devnet.solana.com")
            .maxPaymentAmount("1.0")
            .allowLocal(true)  // Development only
            .build()
        ) {
            // Make payment-enabled request
            Response response = client.get("https://api.example.com/data");
            System.out.println("Success: " + response.body().string());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Build and Run

```bash
# Compile
mvn clean compile

# Run
mvn exec:java -Dexec.mainClass="com.example.App"
```

## Verify Installation

Create a test file to verify everything is working:

```java
import org.openlibx402.core.models.PaymentRequest;
import org.openlibx402.client.X402Client;

public class VerifyInstallation {
    public static void main(String[] args) {
        System.out.println("OpenLibX402 installed successfully!");
        System.out.println("Core version: 0.1.0");
        System.out.println("Client version: 0.1.0");

        // Test imports
        PaymentRequest.class.getName();
        X402Client.class.getName();

        System.out.println("All imports working!");
    }
}
```

Run:
```bash
javac -cp "target/dependency/*" VerifyInstallation.java
java -cp ".:target/dependency/*" VerifyInstallation
```

Expected output:
```
OpenLibX402 installed successfully!
Core version: 0.1.0
Client version: 0.1.0
All imports working!
```

## Package Structure

OpenLibX402 is split into two packages:

### Core Package (`openlibx402-core`)

Provides core functionality:
- Payment models (`PaymentRequest`, `PaymentAuthorization`)
- Error types (`X402Error` hierarchy)
- Blockchain integration (`SolanaPaymentProcessor`)

**When to use:**
- Building custom payment logic
- Integrating with existing HTTP clients
- Creating middleware or frameworks

### Client Package (`openlibx402-client`)

Provides HTTP client implementations:
- `X402Client` - Manual payment control
- `X402AutoClient` - Automatic payment handling

**When to use:**
- Making HTTP requests with payments
- Quick integration with automatic payments
- Standard client-server communication

### Typical Setup

Most applications need both packages:

```xml
<dependencies>
    <!-- Both core and client -->
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

## IDE Setup

### IntelliJ IDEA

1. **Open Project:**
   - File → Open → Select your `pom.xml` or project directory
   - IntelliJ will automatically detect Maven/Gradle and import dependencies

2. **Refresh Dependencies:**
   - Right-click `pom.xml` → Maven → Reload Project
   - Or: View → Tool Windows → Maven → Click refresh icon

3. **Verify:**
   - Check that dependencies appear in External Libraries
   - Try auto-complete for `import org.openlibx402.*`

### Eclipse

1. **Import Project:**
   - File → Import → Maven → Existing Maven Projects
   - Select project directory

2. **Update Dependencies:**
   - Right-click project → Maven → Update Project
   - Check "Force Update of Snapshots/Releases"

3. **Verify:**
   - Check Maven Dependencies in Project Explorer
   - Try importing OpenLibX402 classes

### VS Code

1. **Install Extensions:**
   - Extension Pack for Java
   - Maven for Java

2. **Open Project:**
   - File → Open Folder → Select project directory
   - VS Code will detect `pom.xml` automatically

3. **Refresh:**
   - Command Palette (Cmd/Ctrl+Shift+P) → "Java: Clean Java Language Server Workspace"

## Troubleshooting

### "Package org.openlibx402 does not exist"

**Solution:** Run dependency install:
```bash
mvn clean install
# or
gradle build --refresh-dependencies
```

### "Unsupported class file major version"

**Cause:** Using Java 8 or older.

**Solution:** Upgrade to Java 11 or higher:
```bash
java -version  # Check current version
# Install Java 11+ (see Prerequisites above)
```

### Maven Central Connection Issues

**Symptoms:** Cannot download dependencies.

**Solution 1:** Check internet connection and retry:
```bash
mvn clean install -U  # Force update
```

**Solution 2:** Add Maven Central explicitly to `pom.xml`:
```xml
<repositories>
    <repository>
        <id>central</id>
        <url>https://repo.maven.apache.org/maven2</url>
    </repository>
</repositories>
```

### Dependency Conflicts

**Symptoms:** NoClassDefFoundError or ClassNotFoundException.

**Solution:** Check for conflicts:
```bash
mvn dependency:tree
```

Exclude conflicting dependencies:
```xml
<dependency>
    <groupId>org.openlibx402</groupId>
    <artifactId>openlibx402-client</artifactId>
    <version>0.1.0</version>
    <exclusions>
        <exclusion>
            <groupId>conflicting.group</groupId>
            <artifactId>conflicting-artifact</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### Local Installation Not Found

**Symptoms:** Package not found after `mvn install`.

**Solution:** Check local repository:
```bash
ls ~/.m2/repository/org/openlibx402/
```

If empty, reinstall:
```bash
cd packages/java/openlibx402-core
mvn clean install -U

cd ../openlibx402-client
mvn clean install -U
```

## Environment Setup

### Solana Account

For development, you can use a test account:

```bash
# Set environment variable
export SOLANA_SECRET_KEY="your-base64-encoded-key"
```

In Java:
```java
String keyString = System.getenv("SOLANA_SECRET_KEY");
byte[] secretKey = java.util.Base64.getDecoder().decode(keyString);
Account account = new Account(secretKey);
```

### Network Configuration

**Devnet (Testing):**
```java
String rpcUrl = "https://api.devnet.solana.com";
```

**Mainnet (Production):**
```java
String rpcUrl = "https://api.mainnet-beta.solana.com";
```

## Next Steps

Now that you have OpenLibX402 installed:

1. [Client Quickstart](client-quickstart.md) - Build your first payment-enabled client
2. [Basic Usage Examples](../examples/basic-usage.md) - Learn common patterns
3. [API Reference](../reference/api-reference.md) - Explore the full API

## Version Updates

Check for updates:
```bash
# Maven
mvn versions:display-dependency-updates

# Or check Maven Central
https://search.maven.org/artifact/org.openlibx402/openlibx402-core
```

Update to latest version in your `pom.xml`:
```xml
<dependency>
    <groupId>org.openlibx402</groupId>
    <artifactId>openlibx402-core</artifactId>
    <version>LATEST_VERSION</version>
</dependency>
```

## Support

- **Documentation:** [https://docs.openlibx402.org](https://docs.openlibx402.org)
- **GitHub Issues:** [https://github.com/openlibx402/openlibx402/issues](https://github.com/openlibx402/openlibx402/issues)
- **Examples:** [https://github.com/openlibx402/openlibx402/tree/main/examples/java](https://github.com/openlibx402/openlibx402/tree/main/examples/java)
