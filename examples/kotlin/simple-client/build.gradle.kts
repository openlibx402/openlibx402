plugins {
    kotlin("jvm") version "1.9.20"
    application
}

group = "org.openlibx402.examples"
version = "1.0.0"

repositories {
    mavenCentral()
    mavenLocal()  // For locally installed packages
}

dependencies {
    // OpenLibX402 Dependencies
    implementation("org.openlibx402:openlibx402-core:0.1.0")
    implementation("org.openlibx402:openlibx402-client:0.1.0")

    // Kotlin stdlib
    implementation(kotlin("stdlib"))

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Logging
    implementation("org.slf4j:slf4j-simple:2.0.9")
}

kotlin {
    jvmToolchain(11)
}

application {
    mainClass.set("org.openlibx402.examples.SimpleClientExampleKt")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "11"
        freeCompilerArgs = listOf("-Xjsr305=strict")
    }
}
