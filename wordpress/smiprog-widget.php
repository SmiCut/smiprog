<?php
/**
 * Plugin Name: SmiProg Widget
 * Description: Local SmiProg calculations with the shared SmiCut Material Selector API.
 * Version: __SMIPROG_VERSION__
 * Author: SmiCut AB
 * License: MIT
 * License URI: https://opensource.org/license/mit
 * Copyright: 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 */

if (!defined('ABSPATH')) {
    exit;
}

function smiprog_widget_manifest() {
    static $manifest = null;
    if ($manifest === null) {
        $manifest = json_decode(file_get_contents(__DIR__ . '/manifest.json'), true);
    }
    return $manifest;
}

function smiprog_widget_styles() {
    $base = plugin_dir_url(__FILE__) . 'app/';
    foreach (smiprog_widget_manifest()['styles'] as $style) {
        wp_enqueue_style($style['handle'], $base . $style['file'], array(), $style['hash']);
    }
}

function smiprog_widget_page_styles() {
    $post = get_post();
    if ($post && has_shortcode($post->post_content, 'smiprog')) {
        smiprog_widget_styles();
    }
}
add_action('wp_enqueue_scripts', 'smiprog_widget_page_styles');

function smiprog_widget_shortcode($attributes = array()) {
    static $rendered = false;
    // The app uses one fixed DOM root and must only be mounted once per page.
    if ($rendered) {
        return '';
    }
    $rendered = true;
    $attributes = shortcode_atts(array('locale' => get_locale()), $attributes, 'smiprog');
    $locale = strtolower(str_replace('_', '-', sanitize_text_field($attributes['locale'])));
    if (!preg_match('/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/', $locale)) {
        $locale = 'en';
    }

    $manifest = smiprog_widget_manifest();
    $base = plugin_dir_url(__FILE__) . 'app/';
    smiprog_widget_styles();
    foreach ($manifest['scripts'] as $script) {
        wp_enqueue_script($script['handle'], $base . $script['file'], $script['dependencies'], $script['hash'], true);
    }
    $config = array(
        'locale' => $locale,
        'assetBase' => $base . 'assets/',
        'materialSelectorApiUrl' => $manifest['materialSelectorApiUrl']
    );
    wp_add_inline_script(
        $manifest['scripts'][0]['handle'],
        'window.SmiProgConfig = ' . wp_json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';',
        'before'
    );

    $html = file_get_contents(__DIR__ . '/templates/smiprog.html');
    $html = str_replace('__SMIPROG_ASSET_BASE__', esc_url($base . 'assets/'), $html);
    // Page builders may render the shortcode only after the theme printed its head.
    if (did_action('wp_head')) {
        ob_start();
        wp_print_styles(array_column($manifest['styles'], 'handle'));
        $html = ob_get_clean() . $html;
    }
    return $html;
}
add_shortcode('smiprog', 'smiprog_widget_shortcode');
