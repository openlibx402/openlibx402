plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    `maven-publish`
    signing
    id("org.jetbrains.dokka") version "1.9.20"
}

group = "io.github.openlibx402"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    // Kotlin stdlib
    implementation(kotlin("stdlib"))

    // Public API dependencies - exposed to consumers
    api("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    api("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    api("com.mmorrell:solanaj:1.17.7")
    api("com.squareup.okhttp3:okhttp:4.12.0")

    // Internal dependencies
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}

// Configure Java compatibility
java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "11"
    }
}

// Generate Javadoc JAR from Dokka
val dokkaHtml by tasks.getting(org.jetbrains.dokka.gradle.DokkaTask::class)

val javadocJar by tasks.registering(Jar::class) {
    dependsOn(dokkaHtml)
    archiveClassifier.set("javadoc")
    from(dokkaHtml.outputDirectory)
}

// Generate sources JAR
java {
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            artifact(javadocJar)

            groupId = "io.github.openlibx402"
            artifactId = "openlibx402-core"
            version = "0.1.0"

            pom {
                name.set("OpenLibX402 Core (Kotlin)")
                description.set("Core functionality for X402 payment protocol with Kotlin coroutines and Solana blockchain integration")
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
                        organization.set("OpenLibX402")
                        organizationUrl.set("https://openlibx402.org")
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
                username = project.findProperty("ossrhUsername") as String? ?: System.getenv("OSSRH_USERNAME")
                password = project.findProperty("ossrhPassword") as String? ?: System.getenv("OSSRH_PASSWORD")
            }
        }
    }
}

signing {
    // Use GPG agent to sign artifacts
    useGpgCmd()
    sign(publishing.publications["maven"])
}
