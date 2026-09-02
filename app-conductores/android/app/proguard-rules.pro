# Capacitor Camera plugin — prevent R8 from stripping bridge classes
-keep class com.capacitorjs.plugins.camera.** { *; }
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}
-keep class androidx.camera.** { *; }
-keep class androidx.core.content.FileProvider { *; }
