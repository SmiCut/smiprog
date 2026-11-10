/*
 * SmiProg i18n helper
 * Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 */

(function attachSmiProgI18n(global) {
  "use strict";

  const DEFAULT_LOCALE = "en";
  const documentRef = global.document;
  const config = global.SmiProgConfig || {};
  const baseDictionary = global.SmiProgTranslations || {};
  const dictionaries = baseDictionary[DEFAULT_LOCALE]
    ? baseDictionary
    : { [DEFAULT_LOCALE]: baseDictionary };

  function normalizeLocale(locale) {
    const normalized = String(locale || DEFAULT_LOCALE).trim().toLowerCase().replace(/_/g, "-");
    return normalized || DEFAULT_LOCALE;
  }

  let locale = normalizeLocale(config.locale
    || (documentRef && documentRef.documentElement && documentRef.documentElement.getAttribute("lang"))
    || DEFAULT_LOCALE);

  function getLocaleKey(currentLocale) {
    const normalized = normalizeLocale(currentLocale);
    if (/^zh(?:-|$)/.test(normalized)) {
      return /(?:hant|tw|hk|mo)/.test(normalized) ? "zh-tw" : "zh";
    }
    if (dictionaries[normalized]) return normalized;
    const baseLocale = normalized.split("-")[0];
    if (dictionaries[baseLocale]) return baseLocale;
    return DEFAULT_LOCALE;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function getDictionary() {
    return dictionaries[getLocaleKey(locale)] || dictionaries[DEFAULT_LOCALE] || {};
  }

  function t(key, fallback) {
    const dictionary = getDictionary();
    if (hasOwn(dictionary, key)) return dictionary[key];
    const fallbackDictionary = dictionaries[DEFAULT_LOCALE] || {};
    if (hasOwn(fallbackDictionary, key)) return fallbackDictionary[key];
    return fallback !== undefined ? fallback : key;
  }

  function format(key, values) {
    return t(key).replace(/\{([a-zA-Z]+)\}/g, (match, name) => (
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
    ));
  }

  function getNumberLocale() {
    const key = getLocaleKey(locale);
    if (key === "zh-tw") return "zh-TW";
    if (key === "zh") return "zh-CN";
    try { return Intl.getCanonicalLocales(locale)[0]; }
    catch { return key; }
  }

  function translateElement(element) {
    const htmlKey = element.getAttribute("data-i18n-html");
    if (htmlKey) {
      element.innerHTML = t(htmlKey, element.innerHTML);
    }

    const textKey = element.getAttribute("data-i18n");
    if (textKey) {
      element.textContent = t(textKey, element.textContent);
    }

    const placeholderKey = element.getAttribute("data-i18n-placeholder");
    if (placeholderKey) {
      element.setAttribute("placeholder", t(placeholderKey, element.getAttribute("placeholder") || ""));
    }

    const ariaLabelKey = element.getAttribute("data-i18n-aria-label");
    if (ariaLabelKey) {
      element.setAttribute("aria-label", t(ariaLabelKey, element.getAttribute("aria-label") || ""));
    }

    const altKey = element.getAttribute("data-i18n-alt");
    if (altKey) {
      element.setAttribute("alt", t(altKey, element.getAttribute("alt") || ""));
    }
    const hrefKey = element.getAttribute("data-i18n-href");
    if (hrefKey) {
      const href = t(hrefKey);
      if (href.startsWith("https://smicut.com/")) element.setAttribute("href", href);
    }
  }

  function apply(root) {
    if (!documentRef) return;
    const scope = root || documentRef;
    const selector = "[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-alt], [data-i18n-href]";
    const elements = [];
    if (scope.nodeType === 1 && scope.matches(selector)) {
      elements.push(scope);
    }
    elements.push(...Array.from(scope.querySelectorAll(selector)));
    elements.forEach(translateElement);
  }

  function getLocale() {
    return locale;
  }

  function getMaterialSelectorLanguage() {
    if (/^zh(?:-|$)/.test(locale)) return getLocaleKey(locale);
    return getLocale() || DEFAULT_LOCALE;
  }

  global.SmiProgI18n = Object.freeze({
    apply,
    getLocale,
    getMaterialSelectorLanguage,
    getNumberLocale,
    getLocaleKey: () => getLocaleKey(locale),
    format,
    t
  });
})(window);
