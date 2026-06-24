// In D:\SBR\build.gradle.kts (the one at the root of your project)

plugins {
    id("com.android.application") version "8.10.1" apply false
    // CORRECTED: All versions are now compatible with each other.
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
    id("com.google.devtools.ksp") version "1.9.23-1.0.20" apply false // Now matches Kotlin
    id("com.google.gms.google-services") version "4.4.2" apply false
}