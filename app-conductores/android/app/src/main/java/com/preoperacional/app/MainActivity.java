package com.preoperacional.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int STATUS_BAR_LIGHT = Color.parseColor("#F2F3F4");
    private static final int STATUS_BAR_DARK = Color.parseColor("#0d1422");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Aplicar solo cuando la vista esté adjunta a la ventana; de lo contrario
        // WindowCompat.getInsetsController puede fallar en algunos dispositivos.
        final View decor = getWindow().getDecorView();
        if (decor.isAttachedToWindow()) {
            applyStatusBarTheme();
        } else {
            decor.post(() -> applyStatusBarTheme());
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyStatusBarTheme();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStatusBarTheme();
    }

    /**
     * Adapta solo la franja de la barra de estado al tema del sistema, sin tocar
     * el tema claro fijo de la app:
     *  - Modo claro:  fondo claro  -> iconos negros
     *  - Modo oscuro: fondo navy   -> iconos blancos
     */
    @SuppressWarnings("deprecation")
    private void applyStatusBarTheme() {
        boolean dark = isNightMode();
        getWindow().setStatusBarColor(dark ? STATUS_BAR_DARK : STATUS_BAR_LIGHT);
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(!dark);
        }
    }

    private boolean isNightMode() {
        int uiMode = getResources().getConfiguration().uiMode;
        return (uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }
}