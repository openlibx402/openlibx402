# Kotlin Installation Guide

This guide walks you through installing and setting up the OpenLibX402 Kotlin SDK with coroutines support.

## Prerequisites

### Kotlin and JDK

OpenLibX402 Kotlin SDK requires:
- Kotlin 1.9.0 or higher
- JDK 11 or higher

#### macOS

```bash
# Using Homebrew
brew install openjdk@11
brew install kotlin

# Or use SDKMAN!
curl -s "https://get.sdkman.io" | bash
sdk install java 11.0.20-tem
sdk install kotlin
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install openjdk-11-jdk

# Install Kotlin
curl -s "https://get.sdkman.io" | bash
sdk install kotlin
```

#### Windows

Download and install:
- JDK from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [Adoptium](https://adoptium.net/)
- Kotlin from [kotlinlang.org](https://kotlinlang.org/docs/command-line.html)

#### Verify Installation

```bash
java -version
# Should show: openjdk version "11.0.x" or higher

kotlin -version
# Should show: Kotlin version 1.9.x or higher
```

### Build Tool

Choose either Gradle or Maven. Gradle is recommended for Kotlin projects.

#### Gradle (Recommended for Kotlin)

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

#### Maven

**macOS:**
```bash
brew install maven
```

**Ubuntu/Debian:**
```bash
sudo apt-get install maven
```

**Verify:**
```bash
mvn -version
# Should show: Apache Maven 3.6.x or higher
```

## Installation Methods

### Option 1: Gradle Kotlin DSL (Recommended)

Add to your `build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20"
}

repositories {
    mavenCentral()
}

dependencies {
    // OpenLibX402 packages
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    // Kotlin coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Kotlinx serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Kotlinx datetime
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    // Optional: Logging
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")
    implementation("ch.qos.logback:logback-classic:1.4.11")
}

kotlin {
    jvmToolchain(11)
}
```

Install dependencies:

```bash
gradle build
```

### Option 2: Gradle Groovy DSL

Add to your `build.gradle`:

```groovy
plugins {
    id 'org.jetbrains.kotlin.jvm' version '1.9.20'
    id 'org.jetbrains.kotlin.plugin.serialization' version '1.9.20'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.openlibx402:openlibx402-core:0.1.0'
    implementation 'org.openlibx402:openlibx402-client:0.1.0'

    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
    implementation 'org.jetbrains.kotlinx:kotlinx-datetime:0.4.1'
}
```

### Option 3: Maven

Add to your `pom.xml`:

```xml
<project>
    <properties>
        <kotlin.version>1.9.20</kotlin.version>
        <kotlinx.coroutines.version>1.7.3</kotlinx.coroutines.version>
        <kotlinx.serialization.version>1.6.0</kotlinx.serialization.version>
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

        <!-- Kotlin stdlib -->
        <dependency>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-stdlib</artifactId>
            <version>${kotlin.version}</version>
        </dependency>

        <!-- Coroutines -->
        <dependency>
            <groupId>org.jetbrains.kotlinx</groupId>
            <artifactId>kotlinx-coroutines-core</artifactId>
            <version>${kotlinx.coroutines.version}</version>
        </dependency>

        <!-- Serialization -->
        <dependency>
            <groupId>org.jetbrains.kotlinx</groupId>
            <artifactId>kotlinx-serialization-json</artifactId>
            <version>${kotlinx.serialization.version}</version>
        </dependency>

        <!-- DateTime -->
        <dependency>
            <groupId>org.jetbrains.kotlinx</groupId>
            <artifactId>kotlinx-datetime</artifactId>
            <version>0.4.1</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.jetbrains.kotlin</groupId>
                <artifactId>kotlin-maven-plugin</artifactId>
                <version>${kotlin.version}</version>
                <executions>
                    <execution>
                        <id>compile</id>
                        <phase>compile</phase>
                        <goals>
                            <goal>compile</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <compilerPlugins>
                        <plugin>kotlinx-serialization</plugin>
                    </compilerPlugins>
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>org.jetbrains.kotlin</groupId>
                        <artifactId>kotlin-maven-serialization</artifactId>
                        <version>${kotlin.version}</version>
                    </dependency>
                </dependencies>
            </plugin>
        </plugins>
    </build>
</project>
```

Install dependencies:

```bash
mvn clean install
```

### Option 4: Local Installation (Development)

For local development or testing unreleased versions:

```bash
# Clone repository
git clone https://github.com/openlibx402/openlibx402.git
cd openlibx402

# Install core package
cd packages/kotlin/openlibx402-core
gradle publishToMavenLocal

# Install client package
cd ../openlibx402-client
gradle publishToMavenLocal
```

Then use in your project with the same Gradle/Maven configuration as above.

## Quick Start

### Create a New Kotlin Project with Gradle

```bash
mkdir my-x402-app
cd my-x402-app

# Initialize Gradle project
gradle init --type kotlin-application --dsl kotlin

# Or with specific settings
gradle init \
    --type kotlin-application \
    --dsl kotlin \
    --test-framework kotlintest \
    --package com.example \
    --project-name my-x402-app
```

Edit `build.gradle.kts` to add OpenLibX402 dependencies:

```kotlin
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20"
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // OpenLibX402
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    // Kotlin coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Kotlinx serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Kotlinx datetime
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    // Testing
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(11)
}

application {
    mainClass.set("com.example.AppKt")
}

tasks.test {
    useJUnitPlatform()
}
```

### Create Your First Application

Create `src/main/kotlin/com/example/App.kt`:

```kotlin
package com.example

import kotlinx.coroutines.runBlocking
import org.openlibx402.client.X402AutoClient
import org.openlibx402.core.errors.X402Error
import org.p2p.solanaj.core.Account

suspend fun main() {
    // Create Solana account
    val account = Account()
    println("Public Key: ${account.publicKey}")

    // Create client with DSL
    val client = X402AutoClient(account) {
        rpcUrl = "https://api.devnet.solana.com"
        maxPaymentAmount = "1.0"
        allowLocal = true  // Development only
    }

    client.use {
        try {
            // Make payment-enabled request
            val response = it.get("https://api.example.com/data")
            println("Success: ${response.body?.string()}")
        } catch (e: X402Error) {
            when (e) {
                is X402Error.InsufficientFunds -> {
                    println("Insufficient funds!")
                    println("Required: ${e.requiredAmount}")
                    println("Available: ${e.availableAmount}")
                }
                else -> {
                    println("Error: ${e.message}")
                }
            }
        }
    }
}

// For gradle run compatibility
fun main() = runBlocking {
    main()
}
```

### Build and Run

```bash
# Build
gradle build

# Run
gradle run

# Or with arguments
gradle run --args="argument1 argument2"
```

### Run as JAR

```bash
# Build JAR
gradle jar

# Run JAR
java -jar build/libs/my-x402-app-1.0.0.jar
```

## Verify Installation

Create a test file to verify everything is working:

```kotlin
import org.openlibx402.core.models.PaymentRequest
import org.openlibx402.client.X402Client
import kotlinx.datetime.Clock
import kotlin.time.Duration.Companion.minutes

fun main() {
    println("OpenLibX402 Kotlin SDK installed successfully!")
    println("Core version: 0.1.0")
    println("Client version: 0.1.0")

    // Test imports
    println("PaymentRequest: ${PaymentRequest::class.simpleName}")
    println("X402Client: ${X402Client::class.simpleName}")

    // Test kotlinx libraries
    println("Current time: ${Clock.System.now()}")
    println("Duration: ${5.minutes}")

    println("\nAll imports working!")
}
```

Run:
```bash
gradle run
```

Expected output:
```
OpenLibX402 Kotlin SDK installed successfully!
Core version: 0.1.0
Client version: 0.1.0
PaymentRequest: PaymentRequest
X402Client: X402Client
Current time: 2025-11-05T10:30:00Z
Duration: 5m
All imports working!
```

## Package Structure

OpenLibX402 Kotlin SDK is split into two packages:

### Core Package (`openlibx402-core`)

Provides core functionality:
- Payment models (`PaymentRequest`, `PaymentAuthorization`) as data classes
- Sealed class error hierarchy (`X402Error`)
- Blockchain integration (`SolanaPaymentProcessor`)
- kotlinx.serialization support
- kotlinx.datetime integration

**When to use:**
- Building custom payment logic
- Integrating with existing HTTP clients
- Creating middleware or frameworks

### Client Package (`openlibx402-client`)

Provides HTTP client implementations with coroutines:
- `X402Client` - Manual payment control with suspend functions
- `X402AutoClient` - Automatic payment handling with DSL builder

**When to use:**
- Making HTTP requests with payments
- Quick integration with automatic payments
- Coroutine-based applications

### Typical Setup

Most applications need both packages plus Kotlin dependencies:

```kotlin
dependencies {
    // Both core and client
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    // Kotlin coroutines (required)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Kotlinx serialization (required)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Kotlinx datetime (required)
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
}
```

## IDE Setup

### IntelliJ IDEA (Recommended for Kotlin)

1. **Open Project:**
   - File → Open → Select your `build.gradle.kts` or project directory
   - IntelliJ will automatically detect Gradle and import dependencies

2. **Refresh Dependencies:**
   - Click the "Load Gradle Changes" icon in the toolbar
   - Or: View → Tool Windows → Gradle → Click refresh icon

3. **Enable Kotlin Plugin:**
   - IntelliJ comes with Kotlin plugin pre-installed
   - File → Settings → Plugins → Verify "Kotlin" is enabled

4. **Verify:**
   - Check that dependencies appear in External Libraries
   - Try auto-complete for `import org.openlibx402.*`
   - Coroutine support should be available

### Android Studio

1. **Same as IntelliJ IDEA** - Android Studio is built on IntelliJ

2. **Additional Setup for Android:**
```kotlin
android {
    kotlinOptions {
        jvmTarget = "11"
    }
}
```

### VS Code

1. **Install Extensions:**
   - Kotlin Language
   - Gradle for Java
   - Extension Pack for Java

2. **Open Project:**
   - File → Open Folder → Select project directory
   - VS Code will detect `build.gradle.kts` automatically

3. **Refresh:**
   - Command Palette (Cmd/Ctrl+Shift+P) → "Gradle: Refresh Dependencies"

### Eclipse

1. **Install Kotlin Plugin:**
   - Help → Eclipse Marketplace → Search "Kotlin"
   - Install "Kotlin Plugin for Eclipse"

2. **Import Gradle Project:**
   - File → Import → Gradle → Existing Gradle Project
   - Select project directory

3. **Update Dependencies:**
   - Right-click project → Gradle → Refresh Gradle Project

## Troubleshooting

### "Unresolved reference: openlibx402"

**Solution:** Refresh dependencies:
```bash
gradle build --refresh-dependencies
# or
mvn clean install -U
```

### "Kotlin compiler version mismatch"

**Cause:** Mismatched Kotlin versions.

**Solution:** Ensure all Kotlin dependencies use the same version:
```kotlin
val kotlinVersion = "1.9.20"

plugins {
    kotlin("jvm") version kotlinVersion
    kotlin("plugin.serialization") version kotlinVersion
}
```

### "Unsupported class file major version"

**Cause:** Using Java 8 or older.

**Solution:** Upgrade to Java 11 or higher:
```bash
java -version  # Check current version
sdk install java 11.0.20-tem  # Install Java 11
```

### Coroutines Not Working

**Cause:** Missing coroutines dependency.

**Solution:** Add kotlinx-coroutines:
```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

### Serialization Plugin Error

**Cause:** Missing serialization plugin.

**Solution:** Add plugin to `build.gradle.kts`:
```kotlin
plugins {
    kotlin("plugin.serialization") version "1.9.20"
}
```

### Gradle Daemon Issues

**Symptoms:** Slow builds or stuck processes.

**Solution:** Restart Gradle daemon:
```bash
gradle --stop
gradle build
```

## Environment Setup

### Solana Account

For development, you can use a test account:

```bash
# Set environment variable
export SOLANA_SECRET_KEY="your-base64-encoded-key"
```

In Kotlin:
```kotlin
val keyString = System.getenv("SOLANA_SECRET_KEY")
val secretKey = java.util.Base64.getDecoder().decode(keyString)
val account = Account(secretKey)
```

### Network Configuration

**Devnet (Testing):**
```kotlin
val client = X402Client(
    walletAccount = account,
    rpcUrl = "https://api.devnet.solana.com"
)
```

**Mainnet (Production):**
```kotlin
val client = X402Client(
    walletAccount = account,
    rpcUrl = "https://api.mainnet-beta.solana.com"
)
```

### Coroutine Dispatcher Configuration

```kotlin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asCoroutineDispatcher
import java.util.concurrent.Executors

// Custom dispatcher for payment operations
val paymentDispatcher = Executors.newFixedThreadPool(4)
    .asCoroutineDispatcher()

// Use in client operations
withContext(paymentDispatcher) {
    client.get(url)
}
```

## Next Steps

Now that you have OpenLibX402 Kotlin SDK installed:

1. [Client Quickstart](client-quickstart.md) - Build your first payment-enabled client with coroutines
2. [Basic Usage Examples](../examples/basic-usage.md) - Learn common patterns with suspend functions
3. [API Reference](../reference/api-reference.md) - Explore the full API
4. [Error Handling](../reference/errors.md) - Master sealed class error handling

## Version Updates

Check for updates:
```bash
# Gradle
gradle dependencyUpdates

# Or check Maven Central
https://search.maven.org/artifact/org.openlibx402/openlibx402-core
```

Update to latest version in your `build.gradle.kts`:
```kotlin
dependencies {
    implementation("org.openlibx402:openlibx402-core:LATEST_VERSION")
    implementation("org.openlibx402:openlibx402-client:LATEST_VERSION")
}
```

## Support

- **Documentation:** [https://docs.openlibx402.org](https://docs.openlibx402.org)
- **GitHub Issues:** [https://github.com/openlibx402/openlibx402/issues](https://github.com/openlibx402/openlibx402/issues)
- **Examples:** [https://github.com/openlibx402/openlibx402/tree/main/examples/kotlin](https://github.com/openlibx402/openlibx402/tree/main/examples/kotlin)
- **Kotlin Docs:** [https://kotlinlang.org/docs/home.html](https://kotlinlang.org/docs/home.html)
- **Coroutines Guide:** [https://kotlinlang.org/docs/coroutines-guide.html](https://kotlinlang.org/docs/coroutines-guide.html)
