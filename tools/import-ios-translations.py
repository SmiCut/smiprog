"""Merge the supplied iOS language workbook into the maintained web CSV.

Usage: python3 tools/import-ios-translations.py /path/to/translations.xlsx
Only customer-facing text is imported; workbook notes and source paths stay out.
"""
import csv
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
LOCALES = "en sv da de es fr hu id it ja ko nl pl ru zh zh-tw".split()
IOS_LOCALE = {"zh": "zh-Hans", "zh-tw": "zh-Hant-TW"}


def sheet_rows(archive, name):
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
    sheet = next(s for s in workbook.find("s:sheets", NS) if s.attrib["name"] == name)
    target = rels[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
    target = target.lstrip("/") if target.startswith("/") else "xl/" + target
    rows = []
    for row in ET.fromstring(archive.read(target)).findall("s:sheetData/s:row", NS):
        values = []
        for cell in row:
            column = re.match(r"[A-Z]+", cell.attrib["r"])[0]
            index = 0
            for char in column:
                index = index * 26 + ord(char) - 64
            while len(values) < index:
                values.append("")
            value = cell.findtext("s:v", "", NS)
            if cell.attrib.get("t") == "s":
                value = strings[int(value)]
            elif cell.attrib.get("t") == "inlineStr":
                value = "".join(cell.find("s:is", NS).itertext())
            values[index - 1] = value
        rows.append(values)
    return rows


ALIASES = {
    "help.safetyDistance": "thread.safetyHelp",
    "tabs.threadMilling": "milling.title",
    "tabs.compare": "compare.title",
    "tabs.information": "info.title",
    "start.threadMilling.title": "milling.title",
    "start.threadMilling.description": "home.millingBody",
    "start.compare.title": "compare.title",
    "start.information.title": "info.title",
    "field.material": "material.toMachine",
    "field.threadProfile": "thread.profile",
    "field.threadSize": "thread.size",
    "field.flutes": "tool.flutes",
    "field.manufacturingProcess": "cnc.process",
    "field.controlSystem": "cnc.control",
    "field.threadHand": "thread.hand",
    "field.toolA": "compare.toolA",
    "field.toolB": "compare.toolB",
    "field.radialPassesMax": "cutting.passesMaximum",
    "field.threadsPerInch": "thread.tpi",
    "section.cuttingData": "results.title",
    "section.cncProgram": "cnc.title",
    "section.compare": "compare.title",
    "cnc.disclaimer": "cnc.notice",
    "result.cuttingSpeed": "cutting.speed",
    "result.feedTooth": "compare.feedPerTooth",
    "result.radialPasses": "cutting.passes",
    "result.axialPasses": "results.axial",
    "result.spindleSpeed": "results.rpm",
    "result.feedThreadDiameter": "results.threadFeed",
    "result.feedCenter": "results.center",
    "result.timeToMillThread": "results.time",
    "option.rightHandThread": "thread.right",
    "option.leftHandThread": "thread.left",
    "option.manualSize": "thread.ownDimensions",
    "profile.m-manual": "profile.mFine",
    "profile.g-manual": "profile.gManual",
    "compare.netPrice": "compare.priceAfterDiscount",
    "copy.copied": "action.copied",
    "materialSelector.welcomeTitle": "material.question",
    "materialSelector.welcomeDescription": "material.startDescription",
    "materialSelector.findCategory": "material.find",
    "materialSelector.placeholder": "material.startPlaceholder",
    "materialSelector.applyHelp": "material.applyHelp",
    "materialSelector.selected": "material.selected",
    "materialSelector.showExplanation": "material.showExplanation",
    "materialSelector.hideExplanation": "material.hideExplanation",
    "materialSelector.followUp": "material.followUp",
    "materialSelector.messagePlaceholder": "material.messagePlaceholder",
    "materialSelector.openCalculator": "material.openCalculator",
    "materialSelector.retry": "action.retry",
    "materialSelector.sendMessage": "material.send",
    "materialSelector.apply": "material.use",
    "materialSelector.recommendedCategory": "material.recommended",
    "materialSelector.serverError": "material.serverError",
    "materialSelector.noResponse": "material.noResponse",
    "materialSelector.networkError": "material.network",
    "materialSelector.requestTimedOut": "material.timeout",
}
# Web permits time-only comparisons with empty prices, and the compact custom
# tool label is intentional. Keep the web pitch guidance (including Metric fine).
KEEP_WEB = {"compare.priceError", "tool.custom", "info.step1.body"}


def saving_format(text):
    names = ["tool", "amount", "percent"]
    sequential = iter(names)
    def replace(match):
        name = names[int(match[1]) - 1] if match[1] else next(sequential)
        return "{" + name + "}"
    result = re.sub(r"%(?:(\d+)\$)?@", replace, text).replace("%%", "%")
    if sorted(re.findall(r"\{(\w+)\}", result)) != sorted(names):
        raise ValueError("Unexpected saving arguments")
    return result


def main():
    with zipfile.ZipFile(sys.argv[1]) as archive:
        rows = sheet_rows(archive, "Translations")
        source = {row[0]: dict(zip(rows[0], row)) for row in rows[1:] if row}
        link_rows = sheet_rows(archive, "Published links")
    target = ROOT / "apps/web/i18n/translations.csv"
    with target.open(newline="") as stream:
        reader = csv.DictReader(stream)
        fields = reader.fieldnames
        web = list(reader)
    before = [dict(row) for row in web]
    for row in web:
        key = row["key"]
        if key in KEEP_WEB:
            continue
        source_key = ALIASES.get(key, key)
        if source_key not in source:
            continue
        for locale in LOCALES:
            text = source[source_key][IOS_LOCALE.get(locale, locale)]
            if not text.strip():
                raise ValueError(f"Empty translation: {source_key}/{locale}")
            row[locale] = saving_format(text) if key == "compare.saving" else text
    by_key = {row["key"]: row for row in web}
    for values in link_rows[1:]:
        page, locale, title, url = values[:4]
        locale = {"zh-Hans": "zh", "zh-Hant-TW": "zh-tw"}.get(locale, locale)
        if f"info.{page}.url" in by_key:
            by_key[f"info.{page}.url"][locale] = url
            by_key[f"info.{page}.link"][locale] = title
    changed = sum(a[l] != b[l] for a, b in zip(before, web) for l in LOCALES)
    with target.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(web)
    print(f"Updated {changed} cells; retained {len(web)} web keys across {len(LOCALES)} languages.")


if __name__ == "__main__":
    main()
