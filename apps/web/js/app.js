/*
 * SmiProg Web Widget
 * Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 */

(function attachSmiProgApp(global) {
  "use strict";

  const data = global.SmiProgData;
  const core = global.SmiProgCore;
  const toolWebLinks = global.SmiProgToolWebLinks || {};
  const i18n = global.SmiProgI18n || {
    apply: () => {},
    getMaterialSelectorLanguage: () => "en",
    t: (key, fallback) => fallback !== undefined ? fallback : key
  };

  function uiText(key, fallback) {
    return i18n.t(key, fallback);
  }

  const elements = {
    tabs: Array.from(document.querySelectorAll("#smiprog-app .spg-tab")),
    startButtons: Array.from(document.querySelectorAll("#smiprog-app [data-spg-start-tab]")),
    startPanel: document.getElementById("spg-start-panel"),
    mainPanel: document.getElementById("spg-main-panel"),
    materialSelectorPanel: document.getElementById("spg-material-selector-panel"),
    comparePanel: document.getElementById("spg-compare-panel"),
    informationPanel: document.getElementById("spg-information-panel"),
    noteFrame: document.querySelector("#smiprog-app .spg-note"),
    note: document.getElementById("spg-note-message"),
    process: document.getElementById("spg-process"),
    controlSystem: document.getElementById("spg-control-system"),
    threadHand: document.getElementById("spg-thread-hand"),
    programTemplate: document.getElementById("spg-program-template"),
    threadProfile: document.getElementById("spg-thread-profile"),
    threadSize: document.getElementById("spg-thread-size"),
    material: document.getElementById("spg-material"),
    diameter: document.getElementById("spg-diameter"),
    pitchLabel: document.getElementById("spg-pitch-label"),
    pitchLabelText: document.querySelector("#spg-pitch-label .spg-pitch-label-text"),
    pitch: document.getElementById("spg-pitch"),
    threadLength: document.getElementById("spg-thread-length"),
    safetyDistance: document.getElementById("spg-safety-distance"),
    markedDiameter: document.getElementById("spg-marked-diameter"),
    markedDiameterField: document.getElementById("spg-marked-diameter-field"),
    resetDiameter: document.getElementById("spg-reset-diameter"),
    overrideCutterDiameter: document.getElementById("spg-override-cutter-diameter"),
    overrideEdgeLength: document.getElementById("spg-override-edge-length"),
    overrideFlutes: document.getElementById("spg-override-flutes"),
    overrideCuttingSpeed: document.getElementById("spg-override-cutting-speed"),
    overrideFeed: document.getElementById("spg-override-feed"),
    overrideRadialPasses: document.getElementById("spg-override-radial-passes"),
    tool: document.getElementById("spg-tool"),
    toolLink: document.getElementById("spg-tool-link"),
    toolSummary: document.getElementById("spg-tool-summary"),
    customToolFields: document.getElementById("spg-custom-tool-fields"),
    cuttingData: document.getElementById("spg-cutting-data"),
    finalCuttingSpeed: document.getElementById("spg-final-cutting-speed"),
    finalCuttingSpeedNote: document.getElementById("spg-final-cutting-speed-note"),
    finalFeed: document.getElementById("spg-final-feed"),
    finalFeedNote: document.getElementById("spg-final-feed-note"),
    finalRadialPasses: document.getElementById("spg-final-radial-passes"),
    finalRadialPassesNote: document.getElementById("spg-final-radial-passes-note"),
    finalAxialPasses: document.getElementById("spg-final-axial-passes"),
    finalSpindleSpeed: document.getElementById("spg-final-spindle-speed"),
    finalFeedThread: document.getElementById("spg-final-feed-thread"),
    finalFeedCenter: document.getElementById("spg-final-feed-center"),
    finalMachiningTime: document.getElementById("spg-final-machining-time"),
    cncProgram: document.getElementById("spg-cnc-program"),
    copyCuttingData: document.getElementById("spg-copy-cutting-data"),
    cuttingDataCopyMessage: document.getElementById("spg-cutting-data-copy-message"),
    copyCnc: document.getElementById("spg-copy-cnc"),
    copyMessage: document.getElementById("spg-copy-message"),
    comparePassword: document.getElementById("spg-compare-password"),
    unlockCompare: document.getElementById("spg-unlock-compare"),
    compareLock: document.getElementById("spg-compare-lock"),
    compareContent: document.getElementById("spg-compare-content"),
    compareMaterial: document.getElementById("spg-compare-material"),
    compareThreadProfile: document.getElementById("spg-compare-thread-profile"),
    compareThreadSize: document.getElementById("spg-compare-thread-size"),
    compareDiameter: document.getElementById("spg-compare-diameter"),
    comparePitchLabel: document.getElementById("spg-compare-pitch-label"),
    comparePitchLabelText: document.querySelector("#spg-compare-pitch-label .spg-pitch-label-text"),
    comparePitch: document.getElementById("spg-compare-pitch"),
    compareThreadLength: document.getElementById("spg-compare-thread-length"),
    machineCost: document.getElementById("spg-machine-cost"),
    compareSummary: document.getElementById("spg-compare-summary"),
    compareToolA: document.getElementById("spg-compare-tool-a"),
    compareToolAType: document.getElementById("spg-compare-tool-a-type"),
    compareToolASummary: document.getElementById("spg-compare-tool-a-summary"),
    compareToolAPrice: document.getElementById("spg-compare-tool-a-price"),
    compareToolALife: document.getElementById("spg-compare-tool-a-life"),
    compareToolADiameter: document.getElementById("spg-compare-tool-a-diameter"),
    compareToolALength: document.getElementById("spg-compare-tool-a-length"),
    compareToolAFlutes: document.getElementById("spg-compare-tool-a-flutes"),
    compareToolASpeed: document.getElementById("spg-compare-tool-a-speed"),
    compareToolAFeed: document.getElementById("spg-compare-tool-a-feed"),
    compareToolAPasses: document.getElementById("spg-compare-tool-a-passes"),
    compareToolB: document.getElementById("spg-compare-tool-b"),
    compareToolBType: document.getElementById("spg-compare-tool-b-type"),
    compareToolBSummary: document.getElementById("spg-compare-tool-b-summary"),
    compareToolBPrice: document.getElementById("spg-compare-tool-b-price"),
    compareToolBLife: document.getElementById("spg-compare-tool-b-life"),
    compareToolBDiameter: document.getElementById("spg-compare-tool-b-diameter"),
    compareToolBLength: document.getElementById("spg-compare-tool-b-length"),
    compareToolBFlutes: document.getElementById("spg-compare-tool-b-flutes"),
    compareToolBSpeed: document.getElementById("spg-compare-tool-b-speed"),
    compareToolBFeed: document.getElementById("spg-compare-tool-b-feed"),
    compareToolBPasses: document.getElementById("spg-compare-tool-b-passes"),
    costData: document.getElementById("spg-cost-data")
  };

  let currentResult = null;
  let compareUnlocked = false;
  let currentPitchMode = "mm";
  let currentComparePitchMode = "mm";
  let requestedToolId = "";
  let customBaseToolId = "";
  let diameterToolId = "";
  let catalogueDiameter = "";
  let compareToolAId = "";
  let compareToolBId = "";
  let compareToolACustomBaseId = "";
  let compareToolBCustomBaseId = "";
  let currentCompareResults = null;
  const THREAD_SIZE_CUSTOM = "custom";
  const CUSTOM_TOOL_ID = "__custom_tool__";
  const DEFAULT_THREAD_MILL_IMAGE = "NB08075D21_1.5ISO_AC.png";
  const CUSTOM_SINGLE_TOOTH_IMAGE = "NS06045D16_P60_AC.png";
  const CUSTOM_TWO_TEETH_IMAGE = "NM06045E16_1.0ISO_AC.png";
  const widgetConfig = global.SmiProgConfig || {};
  const ASSET_BASE = String(widgetConfig.assetBase || global.SmiProgAssetBase || "./assets/").replace(/\/?$/, "/");
  const THREAD_MILL_IMAGE_BASE = `${ASSET_BASE}thread-mills/`;
  const DEFAULT_MATERIAL_SELECTOR_API_URL = "https://smicut-material-selector-production.up.railway.app/api/chat";
  const MATERIAL_SELECTOR_API_URL = widgetConfig.materialSelectorApiUrl || global.SmiProgMaterialSelectorApiUrl
    || (global.location && global.location.hostname === "smiprog-web-production.up.railway.app"
      ? "/api/material-selector"
      : DEFAULT_MATERIAL_SELECTOR_API_URL);

  const threadProfileOptions = [
    { id: "m", label: "M - Metric coarse", coreProfileId: "m", pitchMode: "mm", sizeTableId: "metricCoarse" },
    { id: "m-manual", label: "M - Metric (manual)", coreProfileId: "m", pitchMode: "mm" },
    { id: "unc", label: "UNC - Unified", coreProfileId: "un", pitchMode: "tpi", sizeTableId: "unc" },
    { id: "unf", label: "UNF - Unified", coreProfileId: "un", pitchMode: "tpi", sizeTableId: "unf" },
    { id: "unef", label: "UNEF - Unified", coreProfileId: "un", pitchMode: "tpi", sizeTableId: "unef" },
    { id: "un", label: "UN - Unified (manual)", coreProfileId: "un", pitchMode: "tpi" },
    { id: "g", label: "G - Whitworth Pipe Thread", coreProfileId: "g", pitchMode: "tpi", sizeTableId: "g" },
    { id: "g-manual", label: "G - Whitworth (manual)", coreProfileId: "g", pitchMode: "tpi" },
    { id: "bspt", label: "BSPT - Tapered Pipe Thread", coreProfileId: "bspt", pitchMode: "tpi", sizeTableId: "bspt" },
    { id: "pg", label: "PG - Steel Conduit Thread DIN 40430", coreProfileId: "pg", pitchMode: "tpi", sizeTableId: "pg" },
    { id: "npt", label: "NPT - Tapered Pipe Thread", coreProfileId: "npt", pitchMode: "tpi", sizeTableId: "npt" },
    { id: "nptf", label: "NPTF - Tapered Pipe Thread", coreProfileId: "nptf", pitchMode: "tpi", sizeTableId: "nptf" },
    { id: "npsf", label: "NPSF - Pipe Thread", coreProfileId: "npsf", pitchMode: "tpi", sizeTableId: "npsf", hidden: true }
  ];

  const defaultThreadSizeLabels = {
    m: "M10",
    unc: "1/4-20 UNC",
    unf: "1/4-28 UNF",
    unef: "1/4-32 UNEF",
    g: "G 1/4",
    bspt: "BSPT 1/4",
    pg: "PG 9",
    npt: "NPT 1/4",
    nptf: "NPTF 1/4",
    npsf: "NPSF 1/4"
  };

  const metricCoarseThreadSizes = [
    { label: "M1", diameter: 1, pitch: 0.25 },
    { label: "M1.1", diameter: 1.1, pitch: 0.25 },
    { label: "M1.2", diameter: 1.2, pitch: 0.25 },
    { label: "M1.4", diameter: 1.4, pitch: 0.3 },
    { label: "M1.6", diameter: 1.6, pitch: 0.35 },
    { label: "M1.8", diameter: 1.8, pitch: 0.35 },
    { label: "M2", diameter: 2, pitch: 0.4 },
    { label: "M2.2", diameter: 2.2, pitch: 0.45 },
    { label: "M2.5", diameter: 2.5, pitch: 0.45 },
    { label: "M3", diameter: 3, pitch: 0.5 },
    { label: "M3.5", diameter: 3.5, pitch: 0.6 },
    { label: "M4", diameter: 4, pitch: 0.7 },
    { label: "M4.5", diameter: 4.5, pitch: 0.75 },
    { label: "M5", diameter: 5, pitch: 0.8 },
    { label: "M6", diameter: 6, pitch: 1 },
    { label: "M8", diameter: 8, pitch: 1.25 },
    { label: "M10", diameter: 10, pitch: 1.5 },
    { label: "M12", diameter: 12, pitch: 1.75 },
    { label: "M14", diameter: 14, pitch: 2 },
    { label: "M16", diameter: 16, pitch: 2 },
    { label: "M18", diameter: 18, pitch: 2.5 },
    { label: "M20", diameter: 20, pitch: 2.5 },
    { label: "M22", diameter: 22, pitch: 2.5 },
    { label: "M24", diameter: 24, pitch: 3 },
    { label: "M27", diameter: 27, pitch: 3 },
    { label: "M30", diameter: 30, pitch: 3.5 },
    { label: "M33", diameter: 33, pitch: 3.5 },
    { label: "M36", diameter: 36, pitch: 4 },
    { label: "M39", diameter: 39, pitch: 4 }
  ];

  const metricFineKeys = [
    "1|0.25", "1|0.2", "1.1|0.25", "1.1|0.2", "1.2|0.25", "1.2|0.2", "1.4|0.3", "1.4|0.2",
    "1.6|0.35", "1.6|0.2", "1.7|0.35", "1.7|0.2", "1.8|0.35", "1.8|0.2", "2|0.25", "2.2|0.25",
    "2.3|0.4", "2.3|0.25", "2.6|0.45", "2.5|0.35", "2.6|0.35", "3|0.35", "3|0.6", "3.5|0.35",
    "3.5|0.75", "4|0.35", "4|0.5", "4|0.75", "4|0.8", "4.5|0.5", "5|0.5", "5|0.9", "5|1",
    "5.5|0.5", "5.5|0.9", "6|0.5", "6|0.75", "6|1.25", "7|0.5", "7|0.75", "7|1", "8|0.5",
    "8|0.75", "8|1", "8|1.5", "9|0.75", "9|1", "9|1.25", "10|0.5", "10|0.75", "10|1",
    "10|1.25", "11|0.75", "11|1", "11|1.5", "11|1.25", "12|0.75", "12|1", "12|1.25",
    "12|1.5", "13|0.75", "13|1", "13|1.25", "13|1.5", "13|1.75", "14|0.75", "14|1",
    "14|1.25", "14|1.5", "15|1", "15|1.25", "15|1.5", "15|2", "16|1", "16|1.25", "16|1.5",
    "17|1", "17|1.25", "17|1.5", "18|1", "18|1.25", "18|1.5", "18|2", "19|1", "19|1.25",
    "19|1.5", "20|1", "20|1.25", "20|1.5", "20|2", "21|1", "21|1.25", "21|1.5", "22|1",
    "22|1.25", "22|1.5", "22|2", "23|1", "23|1.5", "24|1", "24|1.25", "24|1.5", "24|2",
    "25|1", "25|1.25", "25|1.5", "25|2", "26|1", "26|1.5", "26|2", "27|1", "27|1.5", "27|2",
    "28|1", "28|1.5", "28|2", "30|1", "30|1.5", "30|2", "30|3", "32|1", "32|1.5", "32|2",
    "33|1", "33|1.5", "33|2", "33|3", "34|1.5", "34|2", "35|1.5", "36|1.5", "36|2", "36|3",
    "38|1.5", "38|2", "39|1.5", "39|2", "39|3", "40|1.5", "40|2", "40|3", "42|4.5",
    "42|1.5", "42|2", "42|3", "44|1.5", "45|4.5", "45|1.5", "45|2", "45|3", "45|4",
    "48|5", "48|1.5", "48|2", "48|3", "48|4", "50|1.5", "50|2", "50|3", "52|1.5", "52|2",
    "52|3", "52|4", "52|5", "56|5.5", "56|1.5", "56|2", "56|3", "56|4", "60|5.5",
    "60|1.5", "60|2", "60|3", "60|4", "64|6", "68|6", "63|1.5"
  ];

  const unifiedCoarseThreadSizes = [
    { label: "No. 1-64 UNC", diameter: 1.854, tpi: 64 },
    { label: "No. 2-56 UNC", diameter: 2.184, tpi: 56 },
    { label: "No. 3-48 UNC", diameter: 2.515, tpi: 48 },
    { label: "No. 4-40 UNC", diameter: 2.845, tpi: 40 },
    { label: "No. 5-40 UNC", diameter: 3.175, tpi: 40 },
    { label: "No. 6-32 UNC", diameter: 3.505, tpi: 32 },
    { label: "No. 8-32 UNC", diameter: 4.166, tpi: 32 },
    { label: "No. 10-24 UNC", diameter: 4.826, tpi: 24 },
    { label: "No. 12-24 UNC", diameter: 5.486, tpi: 24 },
    { label: "1/4-20 UNC", diameter: 6.35, tpi: 20 },
    { label: "5/16-18 UNC", diameter: 7.938, tpi: 18 },
    { label: "3/8-16 UNC", diameter: 9.525, tpi: 16 },
    { label: "7/16-14 UNC", diameter: 11.113, tpi: 14 },
    { label: "1/2-13 UNC", diameter: 12.7, tpi: 13 },
    { label: "9/16-12 UNC", diameter: 14.288, tpi: 12 },
    { label: "5/8-11 UNC", diameter: 15.875, tpi: 11 },
    { label: "3/4-10 UNC", diameter: 19.05, tpi: 10 },
    { label: "7/8-9 UNC", diameter: 22.225, tpi: 9 },
    { label: "1-8 UNC", diameter: 25.4, tpi: 8 },
    { label: "1 1/8-7 UNC", diameter: 28.575, tpi: 7 },
    { label: "1 1/4-7 UNC", diameter: 31.75, tpi: 7 },
    { label: "1 3/8-6 UNC", diameter: 34.925, tpi: 6 },
    { label: "1 1/2-6 UNC", diameter: 38.1, tpi: 6 },
    { label: "1 3/4-5 UNC", diameter: 44.45, tpi: 5 },
    { label: "2-4 1/2 UNC", diameter: 50.8, tpi: 4.5 },
    { label: "2 1/4-4 1/2 UNC", diameter: 57.15, tpi: 4.5 },
    { label: "2 1/2-4 UNC", diameter: 63.5, tpi: 4 }
  ];

  const unifiedFineThreadSizes = [
    { label: "No. 0-80 UNF", diameter: 1.524, tpi: 80 },
    { label: "No. 1-72 UNF", diameter: 1.854, tpi: 72 },
    { label: "No. 2-64 UNF", diameter: 2.184, tpi: 64 },
    { label: "No. 3-56 UNF", diameter: 2.515, tpi: 56 },
    { label: "No. 4-48 UNF", diameter: 2.845, tpi: 48 },
    { label: "No. 5-44 UNF", diameter: 3.175, tpi: 44 },
    { label: "No. 6-40 UNF", diameter: 3.505, tpi: 40 },
    { label: "No. 8-36 UNF", diameter: 4.166, tpi: 36 },
    { label: "No. 10-32 UNF", diameter: 4.826, tpi: 32 },
    { label: "No. 12-28 UNF", diameter: 5.486, tpi: 28 },
    { label: "1/4-28 UNF", diameter: 6.35, tpi: 28 },
    { label: "5/16-24 UNF", diameter: 7.938, tpi: 24 },
    { label: "3/8-24 UNF", diameter: 9.525, tpi: 24 },
    { label: "7/16-20 UNF", diameter: 11.113, tpi: 20 },
    { label: "1/2-20 UNF", diameter: 12.7, tpi: 20 },
    { label: "9/16-18 UNF", diameter: 14.288, tpi: 18 },
    { label: "5/8-18 UNF", diameter: 15.875, tpi: 18 },
    { label: "3/4-16 UNF", diameter: 19.05, tpi: 16 },
    { label: "7/8-14 UNF", diameter: 22.225, tpi: 14 },
    { label: "1-12 UNF", diameter: 25.4, tpi: 12 },
    { label: "1 1/8-12 UNF", diameter: 28.575, tpi: 12 },
    { label: "1 1/4-12 UNF", diameter: 31.75, tpi: 12 },
    { label: "1 3/8-12 UNF", diameter: 34.925, tpi: 12 },
    { label: "1 1/2-12 UNF", diameter: 38.1, tpi: 12 }
  ];

  const unifiedExtraFineThreadSizes = [
    { label: "No. 12-32 UNEF", diameter: 5.486, tpi: 32 },
    { label: "1/4-32 UNEF", diameter: 6.35, tpi: 32 },
    { label: "5/16-32 UNEF", diameter: 7.938, tpi: 32 },
    { label: "3/8-32 UNEF", diameter: 9.525, tpi: 32 },
    { label: "7/16-28 UNEF", diameter: 11.113, tpi: 28 },
    { label: "1/2-28 UNEF", diameter: 12.7, tpi: 28 },
    { label: "9/16-24 UNEF", diameter: 14.288, tpi: 24 },
    { label: "5/8-24 UNEF", diameter: 15.875, tpi: 24 },
    { label: "3/4-20 UNEF", diameter: 19.05, tpi: 20 },
    { label: "7/8-20 UNEF", diameter: 22.225, tpi: 20 },
    { label: "1-20 UNEF", diameter: 25.4, tpi: 20 },
    { label: "1 1/16-18 UNEF", diameter: 26.988, tpi: 18 },
    { label: "1 1/8-18 UNEF", diameter: 28.575, tpi: 18 },
    { label: "1 3/16-18 UNEF", diameter: 30.163, tpi: 18 },
    { label: "1 1/4-18 UNEF", diameter: 31.75, tpi: 18 },
    { label: "1 5/16-18 UNEF", diameter: 33.338, tpi: 18 },
    { label: "1 3/8-18 UNEF", diameter: 34.925, tpi: 18 },
    { label: "1 7/16-18 UNEF", diameter: 36.513, tpi: 18 },
    { label: "1 1/2-18 UNEF", diameter: 38.1, tpi: 18 },
    { label: "1 9/16-18 UNEF", diameter: 39.688, tpi: 18 },
    { label: "1 5/8-18 UNEF", diameter: 41.275, tpi: 18 },
    { label: "1 11/16-18 UNEF", diameter: 42.863, tpi: 18 }
  ];

  const bspThreadSizes = [
    { label: "1/16", diameter: 7.723, tpi: 28 },
    { label: "1/8", diameter: 9.728, tpi: 28 },
    { label: "1/4", diameter: 13.157, tpi: 19 },
    { label: "3/8", diameter: 16.662, tpi: 19 },
    { label: "1/2", diameter: 20.955, tpi: 14 },
    { label: "5/8", diameter: 22.911, tpi: 14 },
    { label: "3/4", diameter: 26.441, tpi: 14 },
    { label: "7/8", diameter: 30.201, tpi: 14 },
    { label: "1", diameter: 33.249, tpi: 11 },
    { label: "1 1/8", diameter: 37.897, tpi: 11 },
    { label: "1 1/4", diameter: 41.91, tpi: 11 },
    { label: "1 1/2", diameter: 47.803, tpi: 11 },
    { label: "1 3/4", diameter: 53.746, tpi: 11 },
    { label: "2", diameter: 59.614, tpi: 11 }
  ];

  const nptThreadSizes = [
    { label: "1/16", diameter: 7.938, tpi: 27 },
    { label: "1/8", diameter: 10.287, tpi: 27 },
    { label: "1/4", diameter: 13.716, tpi: 18 },
    { label: "3/8", diameter: 17.145, tpi: 18 },
    { label: "1/2", diameter: 21.336, tpi: 14 },
    { label: "3/4", diameter: 26.67, tpi: 14 },
    { label: "1", diameter: 33.401, tpi: 11.5 },
    { label: "1 1/4", diameter: 42.164, tpi: 11.5 },
    { label: "1 1/2", diameter: 48.26, tpi: 11.5 },
    { label: "2", diameter: 60.325, tpi: 11.5 },
    { label: "2 1/2", diameter: 73.025, tpi: 8 },
    { label: "3", diameter: 88.9, tpi: 8 },
    { label: "4", diameter: 114.3, tpi: 8 }
  ];

  const drysealThreadSizes = [
    { label: "1/16", diameter: 7.938, tpi: 27 },
    { label: "1/8", diameter: 10.287, tpi: 27 },
    { label: "1/4", diameter: 13.716, tpi: 18 },
    { label: "3/8", diameter: 17.145, tpi: 18 },
    { label: "1/2", diameter: 21.336, tpi: 14 },
    { label: "3/4", diameter: 26.67, tpi: 14 },
    { label: "1", diameter: 33.401, tpi: 11.5 },
    { label: "1 1/4", diameter: 42.164, tpi: 11.5 },
    { label: "1 1/2", diameter: 48.26, tpi: 11.5 },
    { label: "2", diameter: 60.325, tpi: 11.5 },
    { label: "2 1/2", diameter: 73.025, tpi: 8 },
    { label: "3", diameter: 88.9, tpi: 8 }
  ];

  const pgThreadSizes = [
    { label: "PG 7", diameter: 12.5, pitch: 1.27, tpi: 20 },
    { label: "PG 9", diameter: 15.2, pitch: 1.411, tpi: 18 },
    { label: "PG 11", diameter: 18.6, pitch: 1.411, tpi: 18 },
    { label: "PG 13.5", diameter: 20.4, pitch: 1.411, tpi: 18 },
    { label: "PG 16", diameter: 22.5, pitch: 1.411, tpi: 18 },
    { label: "PG 21", diameter: 28.3, pitch: 1.588, tpi: 16 },
    { label: "PG 29", diameter: 37, pitch: 1.588, tpi: 16 },
    { label: "PG 36", diameter: 47, pitch: 1.588, tpi: 16 },
    { label: "PG 42", diameter: 54, pitch: 1.588, tpi: 16 },
    { label: "PG 48", diameter: 59.3, pitch: 1.588, tpi: 16 }
  ];

  const threadSizeTables = {
    metricCoarse: dedupeThreadSizes(metricCoarseThreadSizes, "mm"),
    metricFine: dedupeThreadSizes(createMetricFineThreadSizes(), "mm"),
    unc: dedupeThreadSizes(unifiedCoarseThreadSizes, "tpi"),
    unf: dedupeThreadSizes(unifiedFineThreadSizes, "tpi"),
    unef: dedupeThreadSizes(unifiedExtraFineThreadSizes, "tpi"),
    g: prefixThreadSizeLabels("G ", bspThreadSizes),
    bspt: prefixThreadSizeLabels("BSPT ", bspThreadSizes),
    npt: prefixThreadSizeLabels("NPT ", nptThreadSizes),
    nptf: prefixThreadSizeLabels("NPTF ", drysealThreadSizes),
    npsf: prefixThreadSizeLabels("NPSF ", drysealThreadSizes),
    pg: pgThreadSizes.map((size) => normalizeThreadSize(size, "tpi"))
  };

  function getThreadProfile(threadProfileId) {
    return threadProfileOptions.find((profile) => profile.id === threadProfileId) || threadProfileOptions[0];
  }

  function getPitchMode(threadProfileId) {
    return getThreadProfile(threadProfileId).pitchMode;
  }

  function isManualThreadProfile(threadProfileId) {
    return !getThreadProfile(threadProfileId).sizeTableId;
  }

  function getCoreThreadProfileId(threadProfileId) {
    return getThreadProfile(threadProfileId).coreProfileId;
  }

  function roundDimension(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return NaN;
    return Math.round((numericValue + Number.EPSILON) * 1000) / 1000;
  }

  function formatThreadSizeNumber(value) {
    const roundedValue = roundDimension(value);
    return Number.isFinite(roundedValue) ? String(roundedValue) : "";
  }

  function getThreadSizePitchValue(size, pitchMode) {
    const directValue = pitchMode === "tpi" ? Number(size.tpi) : Number(size.pitch);
    if (Number.isFinite(directValue) && directValue > 0) return directValue;
    const convertedSource = pitchMode === "tpi" ? Number(size.pitch) : Number(size.tpi);
    return Number.isFinite(convertedSource) && convertedSource > 0 ? 25.4 / convertedSource : NaN;
  }

  function normalizeThreadSize(size, pitchMode) {
    const pitchValue = getThreadSizePitchValue(size, pitchMode);
    return {
      ...size,
      pitchMode,
      value: `${size.label}|${formatThreadSizeNumber(size.diameter)}|${formatThreadSizeNumber(pitchValue)}`
    };
  }

  function createMetricFineThreadSizes() {
    return metricFineKeys.map((key) => {
      const [diameter, pitch] = key.split("|").map(Number);
      return {
        label: `M${formatThreadSizeNumber(diameter)}x${formatThreadSizeNumber(pitch)}`,
        diameter,
        pitch
      };
    });
  }

  function prefixThreadSizeLabels(prefix, sizes) {
    return sizes.map((size) => normalizeThreadSize({ ...size, label: `${prefix}${size.label}` }, "tpi"));
  }

  function dedupeThreadSizes(sizes, pitchMode) {
    const seenDimensions = new Set();
    return sizes
      .map((size) => normalizeThreadSize(size, pitchMode))
      .filter((size) => {
        const key = `${formatThreadSizeNumber(size.diameter)}|${formatThreadSizeNumber(getThreadSizePitchValue(size, pitchMode))}`;
        if (seenDimensions.has(key)) return false;
        seenDimensions.add(key);
        return true;
      })
      .sort((a, b) => {
        const diameterDelta = Number(a.diameter) - Number(b.diameter);
        if (diameterDelta !== 0) return diameterDelta;
        const pitchDelta = getThreadSizePitchValue(a, pitchMode) - getThreadSizePitchValue(b, pitchMode);
        return pitchDelta !== 0 ? pitchDelta : a.label.localeCompare(b.label);
      });
  }

  function getThreadSizes(threadProfileId) {
    const sizeTableId = getThreadProfile(threadProfileId).sizeTableId;
    return sizeTableId ? (threadSizeTables[sizeTableId] || []) : [];
  }

  function findThreadSizeByDimensions(threadProfileId, diameter, pitchValue) {
    const sizes = getThreadSizes(threadProfileId);
    const roundedDiameter = roundDimension(diameter);
    const roundedPitch = roundDimension(pitchValue);
    if (!Number.isFinite(roundedDiameter) || !Number.isFinite(roundedPitch)) return null;
    return sizes.find((size) => {
      const sizePitchValue = getThreadSizePitchValue(size, getPitchMode(threadProfileId));
      return roundDimension(size.diameter) === roundedDiameter && roundDimension(sizePitchValue) === roundedPitch;
    }) || null;
  }

  function getDefaultThreadSize(threadProfileId) {
    const sizes = getThreadSizes(threadProfileId);
    if (!sizes.length) return null;
    const defaultLabel = defaultThreadSizeLabels[threadProfileId];
    return sizes.find((size) => size.label === defaultLabel) || sizes[0];
  }

  function getMainThreadControls() {
    return {
      threadProfile: elements.threadProfile,
      threadSize: elements.threadSize,
      diameter: elements.diameter,
      pitch: elements.pitch,
      pitchLabelText: elements.pitchLabelText
    };
  }

  function getCompareThreadControls() {
    return {
      threadProfile: elements.compareThreadProfile,
      threadSize: elements.compareThreadSize,
      diameter: elements.compareDiameter,
      pitch: elements.comparePitch,
      pitchLabelText: elements.comparePitchLabelText
    };
  }

  function updateThreadSizeOptions(preferredValue, controls = getMainThreadControls()) {
    const profileId = controls.threadProfile.value;
    const sizes = getThreadSizes(profileId);
    controls.threadSize.innerHTML = "";
    if (!sizes.length) {
      controls.threadSize.appendChild(option(THREAD_SIZE_CUSTOM, "Manual size", true));
      controls.threadSize.value = THREAD_SIZE_CUSTOM;
      controls.threadSize.disabled = true;
      updateThreadDimensionLock(controls);
      return;
    }

    const matchingSize = findThreadSizeByDimensions(profileId, controls.diameter.value, controls.pitch.value);
    const defaultSize = getDefaultThreadSize(profileId) || sizes[0];
    const hasPreferredValue = preferredValue && sizes.some((size) => size.value === preferredValue);
    const selectedValue = hasPreferredValue ? preferredValue : (matchingSize ? matchingSize.value : defaultSize.value);

    controls.threadSize.disabled = false;
    sizes.forEach((size) => {
      controls.threadSize.appendChild(option(size.value, size.label, size.value === selectedValue));
    });
    controls.threadSize.value = selectedValue;
    updateThreadDimensionLock(controls);
  }

  function getSelectedThreadSize(controls = getMainThreadControls()) {
    return getThreadSizes(controls.threadProfile.value).find((size) => size.value === controls.threadSize.value) || null;
  }

  function applyThreadSizeSelection(controls = getMainThreadControls()) {
    if (isManualThreadProfile(controls.threadProfile.value)) return;
    const selectedSize = getSelectedThreadSize(controls);
    if (!selectedSize) return;
    const pitchMode = getPitchMode(controls.threadProfile.value);
    controls.diameter.value = formatPitchInputValue(selectedSize.diameter);
    controls.pitch.value = formatPitchInputValue(getThreadSizePitchValue(selectedSize, pitchMode));
  }

  function applyDefaultForThreadProfile(previousPitchMode, controls = getMainThreadControls()) {
    const defaultSize = getDefaultThreadSize(controls.threadProfile.value);
    if (defaultSize) {
      updateThreadSizeOptions(defaultSize.value, controls);
      controls.threadSize.value = defaultSize.value;
      applyThreadSizeSelection(controls);
      return;
    }

    updateThreadSizeOptions(THREAD_SIZE_CUSTOM, controls);
    controls.threadSize.value = THREAD_SIZE_CUSTOM;
    if (previousPitchMode !== getPitchMode(controls.threadProfile.value)) {
      controls.pitch.value = "";
    }
  }

  function handleThreadProfileChange() {
    const previousPitchMode = currentPitchMode;
    currentPitchMode = updatePitchField(getMainThreadControls());
    applyDefaultForThreadProfile(previousPitchMode, getMainThreadControls());
    recalculate();
  }

  function handleCompareThreadProfileChange() {
    const previousPitchMode = currentComparePitchMode;
    currentComparePitchMode = updatePitchField(getCompareThreadControls());
    applyDefaultForThreadProfile(previousPitchMode, getCompareThreadControls());
    recalculate({ keepTool: true });
  }

  function syncThreadSizeFromDimensions(controls = getMainThreadControls()) {
    if (isManualThreadProfile(controls.threadProfile.value)) {
      controls.threadSize.value = THREAD_SIZE_CUSTOM;
      return;
    }
    const matchingSize = findThreadSizeByDimensions(controls.threadProfile.value, controls.diameter.value, controls.pitch.value);
    if (matchingSize) {
      controls.threadSize.value = matchingSize.value;
      return;
    }
    if (!getSelectedThreadSize(controls)) {
      const defaultSize = getDefaultThreadSize(controls.threadProfile.value);
      if (defaultSize) controls.threadSize.value = defaultSize.value;
      applyThreadSizeSelection(controls);
    }
  }

  function formatPitchInputValue(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
    return String(rounded);
  }

  function updateThreadDimensionLock(controls = getMainThreadControls()) {
    const locked = !isManualThreadProfile(controls.threadProfile.value);
    [controls.diameter, controls.pitch].forEach((element) => {
      element.readOnly = locked;
      element.classList.toggle("spg-control-readonly", locked);
      element.setAttribute("aria-readonly", locked ? "true" : "false");
    });
  }

  function option(value, label, selected) {
    const optionElement = document.createElement("option");
    optionElement.value = value;
    optionElement.textContent = label;
    if (selected) optionElement.selected = true;
    return optionElement;
  }

  function fillSelect(select, items, selectedValue, getValue, getLabel) {
    select.innerHTML = "";
    items.forEach((item, index) => {
      select.appendChild(option(getValue(item), getLabel(item, index), String(getValue(item)) === String(selectedValue)));
    });
  }

  function fillThreadProfileSelect(select, selectedValue) {
    select.innerHTML = "";
    threadProfileOptions.forEach((profile) => {
      const optionElement = option(profile.id, profile.label, profile.id === selectedValue);
      if (profile.hidden) optionElement.hidden = true;
      select.appendChild(optionElement);
    });
  }

  function resultRow(label, value, highlight) {
    const row = document.createElement("div");
    row.className = highlight ? "spg-result-row spg-result-row-highlight" : "spg-result-row";

    const labelElement = document.createElement("span");
    labelElement.className = "spg-result-label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = "spg-result-value";
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    return row;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setNote(message) {
    elements.note.textContent = message;
    elements.noteFrame.hidden = false;
  }

  function setReferenceValueState(element, muted) {
    if (element) element.classList.toggle("spg-result-value-muted", muted);
  }

  function isCustomToolSelected() {
    return elements.tool.value === CUSTOM_TOOL_ID;
  }

  function formatDimension(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "-";
    return numericValue.toLocaleString("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatToolPitch(tool) {
    const numericValue = Number(tool && tool.pitch);
    if (!Number.isFinite(numericValue)) return "-";
    const pitchMode = getPitchMode(elements.threadProfile.value);
    const formattedValue = numericValue.toLocaleString("sv-SE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
    return pitchMode === "tpi" ? `${formattedValue} TPI` : `${formattedValue} mm`;
  }

  function formatNumberInput(value, decimals) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : "";
  }

  function formatDecimal(value, decimals) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "-";
    return numericValue.toLocaleString("sv-SE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatMachiningSeconds(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "-";
    const decimals = Math.abs(numericValue - Math.round(numericValue)) < 0.000001 ? 0 : 1;
    return numericValue.toLocaleString("sv-SE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatCopyInputNumber(value, maxDecimals) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value || "-");
    return numericValue.toLocaleString("sv-SE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
  }

  function getSelectedText(select) {
    return select && select.selectedOptions[0] ? select.selectedOptions[0].textContent.trim() : "-";
  }

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getMaterialIndexFromId(materialId) {
    return data.materials.findIndex((material) => String(material.id) === String(materialId));
  }

  function getMaterialTranslation(index) {
    const material = data.materials[index];
    if (!material) return { group: "", descriptor: "" };

    const group = material.groupKey
      ? uiText(`materialGroup.${material.groupKey}`, material.group || "")
      : (material.group || "");
    const descriptor = material.key
      ? uiText(`materialDescriptor.${material.key}`, material.descriptor || "")
      : (material.descriptor || "");
    return { group, descriptor };
  }

  function getMaterialDetails(material) {
    if (!material) return "";
    const details = [material.hardness, material.tensile].filter(Boolean);
    return details.length ? ` (${details.join(", ")})` : "";
  }

  function getMaterialSourceShortLabelByIndex(index) {
    const material = data.materials[index];
    if (!material) return "";
    if (material.group && material.descriptor) return `${material.group}, ${material.descriptor}`;
    return String(material.label || "").replace(/\s*\([^)]*\)\s*$/, "");
  }

  function getMaterialLabelByIndex(index) {
    const material = data.materials[index];
    if (!material) return "";
    const { group, descriptor } = getMaterialTranslation(index);
    const shortLabel = group && descriptor ? `${group}, ${descriptor}` : getMaterialSourceShortLabelByIndex(index);
    return shortLabel ? shortLabel + getMaterialDetails(material) : (material.label || "");
  }

  function getMaterialShortLabelByIndex(index) {
    const { group, descriptor } = getMaterialTranslation(index);
    return group && descriptor ? `${group}, ${descriptor}` : getMaterialSourceShortLabelByIndex(index);
  }

  function getMaterialSourceLabelByIndex(index) {
    const material = data.materials[index];
    if (!material) return "";
    const shortLabel = getMaterialSourceShortLabelByIndex(index);
    return shortLabel ? shortLabel + getMaterialDetails(material) : (material.label || "");
  }

  function normalizeMaterialText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/n\/mm²/g, "n/mm2")
      .replace(/n\/mm\u00b2/g, "n/mm2")
      .replace(/\brm\s*\(\s*n\/mm2\s*\)\s*<\s*(\d+)/g, "rm < $1 n/mm2")
      .replace(/\bn\/mm2\s*<\s*(\d+)/g, "rm < $1 n/mm2")
      .replace(/\bmpa\b/g, "n/mm2")
      .replace(/\bhardness\b/g, " ")
      .replace(/\btensile\s+strength\b/g, " ")
      .replace(/\bstrength\b/g, " ")
      .replace(/\bmaterial\s+category\b/g, " ")
      .replace(/\bcategory\b/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[.,;:()[\]{}*_`"'%]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getMaterialRecommendationText(text) {
      const source = text || '';
      const sections = [
          /(?:^|\n)##\s*(?:✅\s*)?[^\n]*(?:recommendation|rekommendation|anbefaling|recomendaci[oó]n|recommandation|empfehlung|aanbeveling|raccomandazione|zalecenie|rekomendasi|ajánlás|рекомендац|推奨|おすすめ|推荐|推薦|추천|권장)[^\n]*\s*\n([\s\S]*?)(?=\n##\s|\s*$)/i,
          /(?:^|\n)\s*👉\s*(?:\*\*)?([^\n]+?)(?:\*\*)?\s*(?=\n|$)/i
      ];

      for (let i = 0; i < sections.length; i++) {
          const match = source.match(sections[i]);
          if (match && match[1]) {
              return match[1];
          }
      }

      return '';
  }

  function findMaterialIndexFromNumberedCategory(text) {
    const match = String(text || "").match(/(?:material\s+category|materialkategori(?:nummer)?|category|kategori|material\s+number|material\s+no\.?|materialnummer|material\s+nr\.?)\s*(?:nr\.?|no\.?)?\s*[:#-]?\s*(\d{1,2})/i);
    if (!match) return -1;
    const index = Number.parseInt(match[1], 10) - 1;
    return index >= 0 && index < data.materials.length ? index : -1;
  }

  function findMaterialIndexFromKey(key) {
    const normalizedKey = String(key || "").trim().toLowerCase();
    if (!normalizedKey) return -1;
    return data.materials.findIndex((material) => {
      const materialKey = String(material.key || material.materialCategoryKey || "").trim().toLowerCase();
      return materialKey === normalizedKey;
    });
  }

  function findMaterialIndexFromText(text) {
    const recommendationText = getMaterialRecommendationText(text);
    if (!recommendationText) return findMaterialIndexFromNumberedCategory(text);
    const normalizedText = normalizeMaterialText(recommendationText);
    const matches = [];

    data.materials.forEach((material, index) => {
      const candidates = [
        getMaterialLabelByIndex(index),
        getMaterialShortLabelByIndex(index),
        getMaterialSourceLabelByIndex(index),
        getMaterialSourceShortLabelByIndex(index),
        material.label
      ];

      candidates.forEach((candidate) => {
        const normalizedCandidate = normalizeMaterialText(candidate);
        if (normalizedCandidate && normalizedText.includes(normalizedCandidate)) {
          matches.push({ index, length: normalizedCandidate.length });
        }
      });
    });

    if (!matches.length) return -1;

    matches.sort((left, right) => right.length - left.length);
    const bestLength = matches[0].length;
    const bestIndexes = matches
      .filter((match) => match.length === bestLength)
      .map((match) => match.index)
      .filter((index, position, indexes) => indexes.indexOf(index) === position);

    return bestIndexes.length === 1 ? bestIndexes[0] : -1;
  }

  function applyMaterialIndexToSmiProg(index) {
    const material = data.materials[index];
    if (!material) return false;

    [elements.material, elements.compareMaterial].forEach((select) => {
      if (!select) return;
      select.value = material.id;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    recalculate({ keepTool: true });
    return true;
  }

  function initMaterialSelector() {
    global.SmiCutMaterialSelector.mount({
      root: document.getElementById("spg-material-selector-widget"),
      changeRoot: document.getElementById("smiprog-app"),
      apiUrl: MATERIAL_SELECTOR_API_URL,
      productName: "SmiProg",
      t: uiText,
      getLanguage: () => i18n.getMaterialSelectorLanguage(),
      bridge: {
        findMaterialIndexFromKey,
        findMaterialIndexFromText,
        getMaterialLabel: getMaterialLabelByIndex,
        applyMaterialIndex: applyMaterialIndexToSmiProg
      },
      isMaterialSelected: (index) => [elements.material, elements.compareMaterial]
        .every((select) => select.value === data.materials[index].id),
      calculators: [{
        key: "main",
        label: uiText("tabs.threadMilling", "Internal Thread Milling"),
        open: () => setActiveTab("main")
      }, {
        key: "compare",
        label: uiText("tabs.compare", "Compare"),
        open: () => setActiveTab("compare")
      }]
    });
  }

  function normalizeArticleCode(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function getToolWebEntry(tool) {
    if (!tool || !tool.description) return null;
    const entry = toolWebLinks[normalizeArticleCode(tool.description)];
    if (!entry) return null;
    if (typeof entry === "string") return { ean: entry, image: "" };
    return entry;
  }

  function getToolPageUrl(tool) {
    const entry = getToolWebEntry(tool);
    const linkTarget = entry && (entry.url || entry.href || entry.ean);
    if (!linkTarget) return "";
    if (/^https?:\/\//i.test(linkTarget)) return linkTarget;
    return `https://id.smicut.com/${linkTarget}`;
  }

  function getToolImageUrl(tool) {
    const entry = getToolWebEntry(tool);
    const imageTarget = entry && entry.image ? entry.image : DEFAULT_THREAD_MILL_IMAGE;
    return getThreadMillImageUrl(imageTarget);
  }

  function getThreadMillImageUrl(imageTarget) {
    if (/^https?:\/\//i.test(imageTarget)) return imageTarget;
    if (/^(?:\.\/|\.\.\/|\/)/.test(imageTarget)) return imageTarget;
    return `${THREAD_MILL_IMAGE_BASE}${encodeURIComponent(imageTarget)}`;
  }

  function createThreadMillImage(tool, altText, imageTarget) {
    const imageFrame = document.createElement("div");
    imageFrame.className = "spg-thread-mill-image-frame";
    const image = document.createElement("img");
    image.className = "spg-thread-mill-image";
    image.src = imageTarget ? getThreadMillImageUrl(imageTarget) : getToolImageUrl(tool);
    image.alt = altText || "Solid carbide thread mill";
    image.loading = "lazy";
    image.addEventListener("error", () => {
      const fallbackSrc = `${THREAD_MILL_IMAGE_BASE}${DEFAULT_THREAD_MILL_IMAGE}`;
      if (image.src.endsWith(DEFAULT_THREAD_MILL_IMAGE)) return;
      image.src = fallbackSrc;
    });
    imageFrame.appendChild(image);
    return imageFrame;
  }

  function isSameRoundedDimension(leftValue, rightValue) {
    const left = roundDimension(leftValue);
    const right = roundDimension(rightValue);
    return Number.isFinite(left) && Number.isFinite(right) && left === right;
  }

  function getCustomThreadMillImage(result) {
    const threadPitch = result && result.input ? Number(result.input.programPitch) : NaN;
    const cuttingLength = result && result.tool && result.tool.isCustom
      ? Number(result.tool.cuttingEdgeLength)
      : Number(elements.overrideEdgeLength.value);
    if (!Number.isFinite(threadPitch) || threadPitch <= 0 || !Number.isFinite(cuttingLength) || cuttingLength <= 0) {
      return DEFAULT_THREAD_MILL_IMAGE;
    }
    if (isSameRoundedDimension(cuttingLength, threadPitch)) return CUSTOM_SINGLE_TOOTH_IMAGE;
    if (isSameRoundedDimension(cuttingLength, threadPitch * 2)) return CUSTOM_TWO_TEETH_IMAGE;
    return DEFAULT_THREAD_MILL_IMAGE;
  }

  function getThreadMillType(tool) {
    const article = normalizeArticleCode(tool && tool.description).toUpperCase();
    if (article.startsWith("NBK")) return "Solid Carbide Thread Mill with Internal Axial Coolant, ThreadBurr";
    if (article.startsWith("NBT") || article.startsWith("XBT")) return "Solid Carbide Thread Mill with Internal Radial Coolant, ThreadBurr";
    if (article.startsWith("NS")) {
      return article.includes("_P60_")
        ? "Single Tooth Solid Carbide Thread Mill, Partial Profile"
        : "Single Tooth Solid Carbide Thread Mill";
    }
    if (article.startsWith("NM")) return "Two Teeth Solid Carbide Thread Mill";
    if (article.startsWith("NF")) return "Solid Carbide Thread Mill with Chamfer";
    if (article.startsWith("NB") || article.startsWith("XB")) return "Solid Carbide Thread Mill, ThreadBurr";
    return "Solid Carbide Thread Mill";
  }

  function renderToolLink(tool) {
    const url = getToolPageUrl(tool);
    if (!url) {
      elements.toolLink.removeAttribute("href");
      elements.toolLink.textContent = "\u00a0";
      elements.toolLink.classList.add("spg-tool-link-disabled");
      elements.toolLink.setAttribute("aria-hidden", "true");
      elements.toolLink.tabIndex = -1;
      return;
    }
    elements.toolLink.href = url;
    elements.toolLink.textContent = uiText("tool.linkText", "➜ See tool page for all dimensions and 3D STEP file");
    elements.toolLink.classList.remove("spg-tool-link-disabled");
    elements.toolLink.removeAttribute("aria-hidden");
    elements.toolLink.removeAttribute("tabindex");
  }

  function updateCustomToolVisibility() {
    const customSelected = isCustomToolSelected();
    elements.customToolFields.hidden = !customSelected;
    elements.markedDiameterField.hidden = customSelected;
    elements.tool.closest("#spg-tool-field")?.classList.toggle("spg-tool-field-custom", customSelected);
    elements.toolSummary.hidden = false;
  }

  function fillCustomToolFromTool(tool) {
    if (!tool) return;
    if (!elements.overrideCutterDiameter.value) {
      elements.overrideCutterDiameter.value = formatNumberInput(tool.cutterDiameter, 2);
    }
    if (!elements.overrideEdgeLength.value) {
      elements.overrideEdgeLength.value = formatNumberInput(tool.cuttingEdgeLength, 2);
    }
    if (!elements.overrideFlutes.value) {
      elements.overrideFlutes.value = String(tool.flutes || "");
    }
  }

  function updatePitchField(controls = getMainThreadControls()) {
    const nextMode = getPitchMode(controls.threadProfile.value);
    if (nextMode === "tpi") {
      controls.pitchLabelText.textContent = uiText("field.threadsPerInch", "Threads per inch");
      controls.pitch.placeholder = "e.g. 11, 14, 19";
      controls.pitch.step = "0.001";
      controls.pitch.setAttribute("aria-label", uiText("field.threadsPerInch", "Threads per inch"));
    } else {
      controls.pitchLabelText.textContent = uiText("field.pitch", "Pitch (mm)");
      controls.pitch.placeholder = "e.g. 1.5";
      controls.pitch.step = "0.001";
      controls.pitch.setAttribute("aria-label", uiText("field.pitchInMillimeters", "Pitch in millimeters"));
    }
    return nextMode;
  }

  function clampRadialPassInput() {
    const rawValue = elements.overrideRadialPasses.value;
    if (rawValue === "") return;
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return;
    const clampedValue = Math.min(3, Math.max(1, Math.round(numericValue)));
    if (numericValue !== clampedValue) {
      elements.overrideRadialPasses.value = String(clampedValue);
    }
  }

  function hasPositiveValue(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0;
  }

  function hasThreadLengthInput() {
    return hasPositiveValue(elements.threadLength.value);
  }

  function hasCompareThreadLengthInput() {
    return hasPositiveValue(elements.compareThreadLength.value);
  }

  function getMarkedDiameter() {
    const value = Number(elements.markedDiameter.value.trim().replace(",", "."));
    if (value > 0 && value === Number(catalogueDiameter)) return "";
    return Number.isFinite(value) ? value : 0;
  }

  function getInput() {
    const customToolSelected = isCustomToolSelected();
    return {
      processId: elements.process.value,
      controlSystemId: elements.controlSystem.value,
      threadProfileId: getCoreThreadProfileId(elements.threadProfile.value),
      materialId: elements.material.value,
      programVariant: elements.programTemplate.value,
      threadHand: elements.threadHand.value,
      diameter: elements.diameter.value,
      pitch: elements.pitch.value,
      threadLength: elements.threadLength.value,
      safetyDistance: elements.safetyDistance.value,
      selectedToolId: customToolSelected ? customBaseToolId : (requestedToolId || elements.tool.value),
      overrides: {
        cutterDiameter: customToolSelected ? elements.overrideCutterDiameter.value : getMarkedDiameter(),
        cuttingEdgeLength: customToolSelected ? elements.overrideEdgeLength.value : "",
        flutes: customToolSelected ? elements.overrideFlutes.value : "",
        cuttingSpeed: elements.overrideCuttingSpeed.value,
        feedPerTooth: elements.overrideFeed.value,
        radialPasses: elements.overrideRadialPasses.value
      },
      machineCost: elements.machineCost.value,
      toolLife: "120"
    };
  }

  function updateToolOptions(candidates, selectedToolId, options) {
    const needsThreadLength = options && options.needsThreadLength;
    const requestedId = String(selectedToolId || "");
    const customSelected = requestedId === CUSTOM_TOOL_ID || elements.tool.value === CUSTOM_TOOL_ID;
    elements.tool.innerHTML = "";
    if (needsThreadLength) {
      elements.tool.appendChild(option("", uiText("tool.enterThreadLength", "Enter thread length"), true));
      elements.tool.value = "";
      updateCustomToolVisibility();
      return elements.tool.value;
    }
    if (!candidates.length) {
      elements.tool.appendChild(option("", uiText("tool.noMatchingTool", "No matching tool"), !customSelected));
      elements.tool.appendChild(option(CUSTOM_TOOL_ID, uiText("tool.customDimensions", "➜ Custom tool dimensions"), customSelected));
      elements.tool.value = customSelected ? CUSTOM_TOOL_ID : "";
      updateCustomToolVisibility();
      return elements.tool.value;
    }
    const requestedToolIsAvailable = candidates.some((tool) => String(tool.id) === requestedId);
    const activeToolId = customSelected ? CUSTOM_TOOL_ID : (requestedToolIsAvailable ? requestedId : String(candidates[0].id));
    candidates.forEach((tool) => {
      const label = tool.description;
      elements.tool.appendChild(option(tool.id, label, String(tool.id) === activeToolId));
    });
    elements.tool.appendChild(option(CUSTOM_TOOL_ID, uiText("tool.customDimensions", "➜ Custom tool dimensions"), activeToolId === CUSTOM_TOOL_ID));
    elements.tool.value = activeToolId;
    if (activeToolId !== CUSTOM_TOOL_ID) {
      customBaseToolId = activeToolId;
    }
    updateCustomToolVisibility();
    return activeToolId;
  }

  function renderTool(result) {
    elements.toolSummary.innerHTML = "";
    renderToolLink(null);
    updateCustomToolVisibility();
    if (isCustomToolSelected()) {
      elements.toolSummary.appendChild(createThreadMillImage(null, "Custom solid carbide thread mill", getCustomThreadMillImage(result)));
      return;
    }
    const hasTool = Boolean(result.input.threadLength && result.tool);
    const article = normalizeArticleCode(result.tool && result.tool.description).toUpperCase();
    const unmarkedDiameter = hasTool && (
      [4, 5, 6].includes(Number(result.tool.threadProfileCode)) || article.startsWith("NS")
    );
    document.getElementById("spg-marked-diameter-help").textContent = unmarkedDiameter
      ? "Adjustment of the cutter diameter."
      : "Enter the laser-marked diameter on your cutter.";
    const threadMillType = hasTool ? getThreadMillType(result.tool) : "-";
    const summaryLayout = document.createElement("div");
    summaryLayout.className = "spg-tool-summary-layout";

    const imageFrame = createThreadMillImage(hasTool ? result.tool : null, hasTool ? threadMillType : "");

    const typeRow = resultRow("Type of thread mill", threadMillType);
    typeRow.classList.add("spg-tool-type-row");
    const visualGroup = document.createElement("div");
    visualGroup.className = "spg-tool-visual-group";

    const metricGrid = document.createElement("div");
    metricGrid.className = "spg-tool-metric-grid";

    metricGrid.appendChild(resultRow("Cutting length", hasTool ? `${formatDimension(result.tool.cuttingEdgeLength)} mm` : "-"));
    metricGrid.appendChild(resultRow("Flutes", hasTool ? String(result.tool.flutes) : "-"));

    summaryLayout.appendChild(metricGrid);
    visualGroup.appendChild(typeRow);
    visualGroup.appendChild(imageFrame);
    elements.toolSummary.appendChild(summaryLayout);
    if (hasTool) {
      renderToolLink(result.tool);
      visualGroup.appendChild(elements.toolLink);
    }
    summaryLayout.appendChild(visualGroup);
  }

  function renderCuttingData(result) {
    if (!result.cuttingData) {
      [
        elements.finalCuttingSpeed,
        elements.finalFeed,
        elements.finalRadialPasses,
        elements.finalAxialPasses,
        elements.finalSpindleSpeed,
        elements.finalFeedThread,
        elements.finalFeedCenter,
        elements.finalMachiningTime
      ].forEach((element) => setText(element, "-"));
      setText(elements.finalCuttingSpeedNote, "");
      setText(elements.finalFeedNote, "");
      setText(elements.finalRadialPassesNote, "");
      [
        elements.finalCuttingSpeed,
        elements.finalFeed,
        elements.finalRadialPasses
      ].forEach((element) => setReferenceValueState(element, false));
      return;
    }
    const c = result.cuttingData;
    const overrides = result.input && result.input.overrides ? result.input.overrides : {};
    setText(elements.finalCuttingSpeed, `${core.fmt(c.recommendedCuttingSpeed, 0)} m/min`);
    setText(elements.finalCuttingSpeedNote, "");
    setReferenceValueState(elements.finalCuttingSpeed, Boolean(overrides.cuttingSpeed));
    setText(elements.finalFeed, `${formatDecimal(c.calculatedFeedPerTooth, 3)} mm/tooth`);
    setText(elements.finalFeedNote, "");
    setReferenceValueState(elements.finalFeed, Boolean(overrides.feedPerTooth));
    setText(elements.finalRadialPasses, String(c.calculatedRadialPasses));
    setText(elements.finalRadialPassesNote, "");
    setReferenceValueState(elements.finalRadialPasses, Boolean(overrides.radialPasses));
    setText(elements.finalAxialPasses, String(c.axialPasses));
    setText(elements.finalSpindleSpeed, `${core.fmt(c.spindleSpeed, 0)} rpm`);
    setText(elements.finalFeedThread, `${core.fmt(c.feedAtThreadDiameter, 0)} mm/min`);
    setText(elements.finalFeedCenter, `${core.fmt(c.centerFeed, 0)} mm/min`);
    setText(elements.finalMachiningTime, `${formatMachiningSeconds(c.machiningTime)} seconds`);
  }

  function getCompareControls(side) {
    const prefix = side === "a" ? "A" : "B";
    return {
      tool: elements[`compareTool${prefix}`],
      type: elements[`compareTool${prefix}Type`],
      summary: elements[`compareTool${prefix}Summary`],
      price: elements[`compareTool${prefix}Price`],
      life: elements[`compareTool${prefix}Life`],
      diameter: elements[`compareTool${prefix}Diameter`],
      length: elements[`compareTool${prefix}Length`],
      flutes: elements[`compareTool${prefix}Flutes`],
      speed: elements[`compareTool${prefix}Speed`],
      feed: elements[`compareTool${prefix}Feed`],
      passes: elements[`compareTool${prefix}Passes`]
    };
  }

  function getCompareOperationInput() {
    return {
      processId: elements.process.value,
      controlSystemId: elements.controlSystem.value,
      threadProfileId: getCoreThreadProfileId(elements.compareThreadProfile.value),
      materialId: elements.compareMaterial.value,
      programVariant: "",
      diameter: elements.compareDiameter.value,
      pitch: elements.comparePitch.value,
      threadLength: elements.compareThreadLength.value,
      safetyDistance: "2",
      machineCost: elements.machineCost.value
    };
  }

  function findCompareTool(candidates, toolId) {
    return candidates.find((tool) => String(tool.id) === String(toolId)) || null;
  }

  function getCompareCustomBaseToolId(side) {
    return side === "a" ? compareToolACustomBaseId : compareToolBCustomBaseId;
  }

  function setCompareCustomBaseToolId(side, toolId) {
    if (side === "a") {
      compareToolACustomBaseId = toolId || "";
    } else {
      compareToolBCustomBaseId = toolId || "";
    }
  }

  function setInputPlaceholder(input, value, decimals) {
    const numericValue = Number(value);
    input.placeholder = Number.isFinite(numericValue) ? formatDecimal(numericValue, decimals) : "Auto";
  }

  function getDefaultCompareToolId(side, candidates) {
    const mainToolId = currentResult && currentResult.tool && !currentResult.tool.isCustom ? String(currentResult.tool.id) : "";
    if (side === "a" && mainToolId && candidates.some((tool) => String(tool.id) === mainToolId)) {
      return mainToolId;
    }
    if (side === "b") {
      const avoidToolId = compareToolAId || mainToolId;
      const alternateTool = candidates.find((tool) => String(tool.id) !== String(avoidToolId));
      return String((alternateTool || candidates[0]).id);
    }
    return candidates.length ? String(candidates[0].id) : "";
  }

  function updateCompareToolSelect(side, candidates, options) {
    const controls = getCompareControls(side);
    const needsThreadLength = options && options.needsThreadLength;
    const previousToolId = side === "a" ? (compareToolAId || controls.tool.value) : (compareToolBId || controls.tool.value);
    const customSelected = previousToolId === CUSTOM_TOOL_ID || controls.tool.value === CUSTOM_TOOL_ID;
    const previousCustomBaseId = getCompareCustomBaseToolId(side);

    controls.tool.innerHTML = "";
    if (needsThreadLength) {
      controls.tool.appendChild(option("", uiText("tool.enterThreadLength", "Enter thread length"), true));
      return "";
    }

    const hasCandidates = candidates.length > 0;
    if (!hasCandidates) {
      controls.tool.appendChild(option("", uiText("tool.noMatchingTool", "No matching tool"), !customSelected));
      controls.tool.appendChild(option(CUSTOM_TOOL_ID, uiText("tool.customDimensions", "➜ Custom tool dimensions"), customSelected));
      controls.tool.value = customSelected ? CUSTOM_TOOL_ID : "";
      return controls.tool.value;
    }

    const previousIsAvailable = candidates.some((tool) => String(tool.id) === String(previousToolId));
    const customBaseIsAvailable = candidates.some((tool) => String(tool.id) === String(previousCustomBaseId));
    const activeToolId = customSelected
      ? CUSTOM_TOOL_ID
      : (previousIsAvailable ? String(previousToolId) : getDefaultCompareToolId(side, candidates));

    candidates.forEach((tool) => {
      controls.tool.appendChild(option(String(tool.id), tool.description, String(tool.id) === String(activeToolId)));
    });
    controls.tool.appendChild(option(CUSTOM_TOOL_ID, uiText("tool.customDimensions", "➜ Custom tool dimensions"), activeToolId === CUSTOM_TOOL_ID));
    controls.tool.value = activeToolId;
    if (activeToolId === CUSTOM_TOOL_ID && !customBaseIsAvailable) {
      const fallbackBaseToolId = previousIsAvailable ? String(previousToolId) : getDefaultCompareToolId(side, candidates);
      setCompareCustomBaseToolId(side, fallbackBaseToolId);
    } else if (activeToolId !== CUSTOM_TOOL_ID) {
      setCompareCustomBaseToolId(side, activeToolId);
    }
    return activeToolId;
  }

  function updateCompareToolOptions(candidates, options) {
    compareToolAId = updateCompareToolSelect("a", candidates, options);
    compareToolBId = updateCompareToolSelect("b", candidates, options);
  }

  function hasCompareDimensionOverride(controls) {
    return Boolean(controls.diameter.value || controls.length.value || controls.flutes.value);
  }

  function hasCompleteCompareCustomDimensions(controls) {
    return Boolean(controls.diameter.value && controls.length.value && controls.flutes.value);
  }

  function getCompareDimensionOverride(controls, selectedTool, key) {
    const value = controls[key].value;
    if (value !== "") return value;
    if (controls.tool.value === CUSTOM_TOOL_ID) return "";
    if (!selectedTool) return "";
    if (key === "diameter") return String(selectedTool.cutterDiameter || "");
    if (key === "length") return String(selectedTool.cuttingEdgeLength || "");
    if (key === "flutes") return String(selectedTool.flutes || "");
    return "";
  }

  function getCompareScenarioInput(side, candidates, operationInput) {
    const controls = getCompareControls(side);
    const selectedToolId = controls.tool.value;
    const dimensionOverride = selectedToolId === CUSTOM_TOOL_ID;
    const baseToolId = dimensionOverride ? getCompareCustomBaseToolId(side) : selectedToolId;
    const selectedTool = findCompareTool(candidates, baseToolId);
    return {
      ...operationInput,
      selectedToolId: dimensionOverride ? (selectedTool ? String(selectedTool.id) : "") : selectedToolId,
      toolLife: controls.life.value || "120",
      overrides: {
        toolPrice: controls.price.value,
        cutterDiameter: dimensionOverride ? getCompareDimensionOverride(controls, selectedTool, "diameter") : "",
        cuttingEdgeLength: dimensionOverride ? getCompareDimensionOverride(controls, selectedTool, "length") : "",
        flutes: dimensionOverride ? getCompareDimensionOverride(controls, selectedTool, "flutes") : "",
        cuttingSpeed: controls.speed.value,
        feedPerTooth: controls.feed.value,
        radialPasses: controls.passes.value
      }
    };
  }

  function createCompareToolMetric(label, value, input) {
    const item = document.createElement("div");
    item.className = input ? "spg-compare-tool-metric spg-compare-tool-metric-input" : "spg-compare-tool-metric";

    const labelElement = document.createElement("span");
    labelElement.className = "spg-result-label";
    labelElement.textContent = label;
    item.appendChild(labelElement);

    if (input) {
      input.classList.remove("spg-compare-row-input");
      input.placeholder = "";
      item.appendChild(input);
    } else {
      const valueElement = document.createElement("span");
      valueElement.className = "spg-result-value";
      valueElement.textContent = value;
      item.appendChild(valueElement);
    }

    return item;
  }

  function createCompareToolLink(tool) {
    const link = document.createElement("a");
    link.className = "spg-tool-link spg-compare-tool-link";
    link.textContent = uiText("tool.linkText", "➜ See tool page for all dimensions and 3D STEP file");
    const url = getToolPageUrl(tool);
    if (!url) {
      link.removeAttribute("href");
      link.textContent = "\u00a0";
      link.classList.add("spg-tool-link-disabled");
      link.setAttribute("aria-hidden", "true");
      link.tabIndex = -1;
      return link;
    }
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
  }

  function renderCompareToolSummary(side, result, selectedTool) {
    const controls = getCompareControls(side);
    const selectedToolId = controls.tool.value;
    const resultTool = result && result.tool ? result.tool : selectedTool;
    const customSelected = selectedToolId === CUSTOM_TOOL_ID;
    const hasVisibleTool = Boolean(resultTool && !customSelected);
    const toolType = customSelected
      ? uiText("tool.customDimensions", "➜ Custom tool dimensions").replace(/^➜\s*/, "")
      : (hasVisibleTool ? getThreadMillType(resultTool) : "-");

    controls.summary.innerHTML = "";
    const metricGrid = document.createElement("div");
    metricGrid.className = "spg-compare-tool-metric-grid";
    if (customSelected) {
      metricGrid.appendChild(createCompareToolMetric(uiText("field.cutterDiameter", "Cutter diameter (mm)").replace(/\s*\(.*\)$/, ""), "", controls.diameter));
      metricGrid.appendChild(createCompareToolMetric(uiText("field.cuttingLength", "Cutting length (mm)").replace(/\s*\(.*\)$/, ""), "", controls.length));
      metricGrid.appendChild(createCompareToolMetric(uiText("field.flutes", "Flutes"), "", controls.flutes));
    } else {
      metricGrid.appendChild(createCompareToolMetric(uiText("field.cutterDiameter", "Cutter diameter (mm)").replace(/\s*\(.*\)$/, ""), resultTool ? `${formatDimension(resultTool.cutterDiameter)} mm` : "-"));
      metricGrid.appendChild(createCompareToolMetric(uiText("field.cuttingLength", "Cutting length (mm)").replace(/\s*\(.*\)$/, ""), resultTool ? `${formatDimension(resultTool.cuttingEdgeLength)} mm` : "-"));
      metricGrid.appendChild(createCompareToolMetric(uiText("field.flutes", "Flutes"), resultTool ? formatDecimal(resultTool.flutes, 0) : "-"));
    }
    controls.summary.appendChild(metricGrid);

    const typeText = document.createElement("div");
    typeText.className = "spg-compare-tool-type-label";
    typeText.textContent = toolType;

    const imageAlt = customSelected
      ? "Custom solid carbide thread mill"
      : (hasVisibleTool ? getThreadMillType(resultTool) : "Solid carbide thread mill");
    const imageTarget = customSelected ? getCustomThreadMillImage(result) : undefined;
    const visualRow = document.createElement("div");
    visualRow.className = "spg-compare-tool-visual-row";
    const imageFrame = createThreadMillImage(hasVisibleTool ? resultTool : null, imageAlt, imageTarget);
    imageFrame.classList.add("spg-compare-thread-mill-image-frame");
    visualRow.appendChild(typeText);
    visualRow.appendChild(imageFrame);
    visualRow.appendChild(createCompareToolLink(hasVisibleTool ? resultTool : null));
    controls.summary.appendChild(visualRow);
  }

  function updateCompareToolMeta(side, candidates, result) {
    const controls = getCompareControls(side);
    const selectedToolId = controls.tool.value;
    const selectedTool = selectedToolId === CUSTOM_TOOL_ID ? null : findCompareTool(candidates, selectedToolId);
    const resultTool = result && result.tool ? result.tool : selectedTool;

    controls.type.textContent = selectedToolId === CUSTOM_TOOL_ID
      ? uiText("tool.customDimensions", "➜ Custom tool dimensions").replace(/^➜\s*/, "")
      : (resultTool ? getThreadMillType(resultTool) : "-");
    renderCompareToolSummary(side, result, selectedTool);

    if (selectedTool) {
      setInputPlaceholder(controls.price, selectedTool.priceEur, 2);
      setInputPlaceholder(controls.diameter, selectedTool.cutterDiameter, 2);
      setInputPlaceholder(controls.length, selectedTool.cuttingEdgeLength, 2);
      setInputPlaceholder(controls.flutes, selectedTool.flutes, 0);
    } else {
      controls.price.placeholder = "Required";
      controls.diameter.placeholder = "Required";
      controls.length.placeholder = "Required";
      controls.flutes.placeholder = "Required";
    }

    if (result && result.cuttingData) {
      setInputPlaceholder(controls.speed, result.cuttingData.recommendedCuttingSpeed, 0);
      setInputPlaceholder(controls.feed, result.cuttingData.calculatedFeedPerTooth, 3);
      setInputPlaceholder(controls.passes, result.cuttingData.calculatedRadialPasses, 0);
    } else {
      controls.speed.placeholder = "Auto";
      controls.feed.placeholder = "Auto";
      controls.passes.placeholder = "Auto";
    }
  }

  function formatCompareSeconds(value) {
    return `${formatDecimal(value, 1)} s`;
  }

  function formatCompareCurrency(value) {
    return `€ ${formatDecimal(value, 2)}`;
  }

  function formatComparePercent(leftValue, rightValue) {
    const left = Number(leftValue);
    const right = Number(rightValue);
    if (!Number.isFinite(left) || !Number.isFinite(right) || left === 0) return "";
    const percent = (right / left - 1) * 100;
    const rounded = Math.round(percent);
    return `${rounded}%`;
  }

  function getCompareInputParking() {
    let parking = document.getElementById("spg-compare-input-parking");
    if (!parking) {
      parking = document.createElement("div");
      parking.id = "spg-compare-input-parking";
      parking.hidden = true;
      elements.compareContent.appendChild(parking);
    }
    return parking;
  }

  function parkCompareInputs() {
    const parking = getCompareInputParking();
    ["a", "b"].forEach((side) => {
      const controls = getCompareControls(side);
      ["price", "life", "diameter", "length", "flutes", "speed", "feed", "passes"].forEach((key) => {
        if (controls[key]) parking.appendChild(controls[key]);
      });
    });
  }

  function getActiveCompareInputId() {
    const activeElement = document.activeElement;
    return activeElement && activeElement.classList.contains("spg-compare-row-input") ? activeElement.id : "";
  }

  function restoreCompareInputFocus(inputId) {
    if (!inputId) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const valueLength = input.value.length;
    input.focus({ preventScroll: true });
    if (typeof input.setSelectionRange === "function") {
      try {
        input.setSelectionRange(valueLength, valueLength);
      } catch (error) {
        // Number inputs do not allow text selection in some browsers.
      }
    }
  }

  function addCompareDifferenceClass(element, diffText) {
    const numericDiff = Number(String(diffText || "").replace("%", ""));
    if (!Number.isFinite(numericDiff)) return;
    if (numericDiff < 0) element.classList.add("spg-compare-better");
    if (numericDiff > 0) element.classList.add("spg-compare-worse");
  }

  function hasCompareOwnValue(input) {
    return Boolean(input && String(input.value || "").trim() !== "");
  }

  function getCompareReferenceToolPrice(result) {
    return result && result.tool ? result.tool.priceEur : "";
  }

  function getCompareReferenceToolLife() {
    return 120;
  }

  function createCompareValueCell(value, input, diffText) {
    const cell = document.createElement("span");
    cell.className = (input || diffText)
      ? "spg-result-value spg-compare-value-cell spg-compare-value-cell-editable"
      : "spg-result-value spg-compare-value-cell";

    const valueElement = document.createElement("span");
    valueElement.className = "spg-compare-cell-value";
    if (hasCompareOwnValue(input)) valueElement.classList.add("spg-result-value-muted");
    valueElement.textContent = value;
    cell.appendChild(valueElement);

    if (input) {
      input.classList.add("spg-compare-row-input");
      if (!input.value) input.placeholder = "";
      cell.appendChild(input);
      syncCompareOwnInputReferenceState(input);
    } else if (diffText) {
      const diffElement = document.createElement("span");
      diffElement.className = "spg-compare-cell-difference";
      diffElement.textContent = diffText;
      addCompareDifferenceClass(diffElement, diffText);
      cell.appendChild(diffElement);
    }

    return cell;
  }

  function syncCompareOwnInputReferenceState(input) {
    if (!input) return;
    const cell = input.closest(".spg-compare-value-cell");
    const valueElement = cell && cell.querySelector(".spg-compare-cell-value");
    if (valueElement) valueElement.classList.toggle("spg-result-value-muted", hasCompareOwnValue(input));
  }

  function createCompareResultRow(label, leftValue, rightValue, options) {
    const row = document.createElement("div");
    row.className = "spg-compare-result-row spg-result-row";
    if (options && options.highlight) row.classList.add("spg-result-row-highlight");
    if (options && options.editable) row.classList.add("spg-compare-result-row-editable");

    const labelElement = document.createElement("span");
    labelElement.className = "spg-result-label";
    labelElement.textContent = label;

    const leftElement = createCompareValueCell(leftValue, options && options.leftInput, options && options.leftDiff);
    const rightElement = createCompareValueCell(rightValue, options && options.rightInput, options && options.rightDiff);

    row.appendChild(labelElement);
    row.appendChild(leftElement);
    row.appendChild(rightElement);
    return row;
  }

  function getCompareResultRows(resultA, resultB) {
    const invalidA = Boolean(resultA && resultA.errors && resultA.errors.length);
    const invalidB = Boolean(resultB && resultB.errors && resultB.errors.length);
    const cA = !invalidA && resultA && resultA.cuttingData ? resultA.cuttingData : {};
    const cB = !invalidB && resultB && resultB.cuttingData ? resultB.cuttingData : {};
    const costA = !invalidA && resultA && resultA.costData ? resultA.costData : {};
    const costB = !invalidB && resultB && resultB.costData ? resultB.costData : {};
    const controlsA = getCompareControls("a");
    const controlsB = getCompareControls("b");
    const valueOrDash = (value, decimals, suffix = "") => (
      Number.isFinite(value) ? `${formatDecimal(value, decimals)}${suffix}` : "-"
    );
    const diffOrNull = (baseValue, compareValue) => (
      Number.isFinite(baseValue) && Number.isFinite(compareValue) ? formatComparePercent(baseValue, compareValue) : null
    );

    return [
      ["Tooling cost", invalidA ? "-" : valueOrDash(getCompareReferenceToolPrice(resultA), 2, " €"), invalidB ? "-" : valueOrDash(getCompareReferenceToolPrice(resultB), 2, " €"), controlsA.price, controlsB.price],
      ["Tool life", invalidA ? "-" : `${formatDecimal(getCompareReferenceToolLife(), 0)} minutes`, invalidB ? "-" : `${formatDecimal(getCompareReferenceToolLife(), 0)} minutes`, controlsA.life, controlsB.life],
      ["Cutting speed", valueOrDash(cA.recommendedCuttingSpeed, 0, " m/min"), valueOrDash(cB.recommendedCuttingSpeed, 0, " m/min"), controlsA.speed, controlsB.speed],
      ["Feed/tooth", valueOrDash(cA.calculatedFeedPerTooth, 3, " mm/tooth"), valueOrDash(cB.calculatedFeedPerTooth, 3, " mm/tooth"), controlsA.feed, controlsB.feed],
      ["Radial passes (max 3)", valueOrDash(cA.calculatedRadialPasses, 0), valueOrDash(cB.calculatedRadialPasses, 0), controlsA.passes, controlsB.passes],
      ["Axial passes", valueOrDash(cA.axialPasses, 0), valueOrDash(cB.axialPasses, 0)],
      ["Spindle speed", valueOrDash(cA.spindleSpeed, 0, " rpm"), valueOrDash(cB.spindleSpeed, 0, " rpm")],
      ["Feed at thread diameter", valueOrDash(cA.feedAtThreadDiameter, 0, " mm/min"), valueOrDash(cB.feedAtThreadDiameter, 0, " mm/min")],
      ["Feed in center of mill", valueOrDash(cA.centerFeed, 0, " mm/min"), valueOrDash(cB.centerFeed, 0, " mm/min")],
      ["Time to mill thread", valueOrDash(cA.machiningTime, 1, " seconds"), valueOrDash(cB.machiningTime, 1, " seconds"), null, null, diffOrNull(cB.machiningTime, cA.machiningTime), diffOrNull(cA.machiningTime, cB.machiningTime)],
      ["Tooling cost per thread", valueOrDash(costA.toolingCostPerThread, 2, " €"), valueOrDash(costB.toolingCostPerThread, 2, " €"), null, null, diffOrNull(costB.toolingCostPerThread, costA.toolingCostPerThread), diffOrNull(costA.toolingCostPerThread, costB.toolingCostPerThread)],
      ["Total cost per thread", valueOrDash(costA.totalCostPerThread, 2, " €"), valueOrDash(costB.totalCostPerThread, 2, " €"), null, null, diffOrNull(costB.totalCostPerThread, costA.totalCostPerThread), diffOrNull(costA.totalCostPerThread, costB.totalCostPerThread)]
    ];
  }

  function createCompareMobileResultCard(title, article, rows, side) {
    const card = document.createElement("section");
    card.className = "spg-compare-mobile-result-card";

    const header = document.createElement("div");
    header.className = "spg-compare-mobile-result-header";
    const titleElement = document.createElement("span");
    titleElement.className = "spg-compare-mobile-result-title";
    titleElement.textContent = title;
    const articleElement = document.createElement("span");
    articleElement.className = "spg-compare-mobile-result-article";
    articleElement.textContent = article;
    header.appendChild(titleElement);
    header.appendChild(articleElement);
    card.appendChild(header);

    rows.forEach(([label, leftValue, rightValue, leftInput, rightInput, leftDiff, rightDiff]) => {
      const sourceInput = side === "a" ? leftInput : rightInput;
      const displayValue = side === "a" ? leftValue : rightValue;
      const diffText = side === "a" ? leftDiff : rightDiff;
      const row = document.createElement("div");
      row.className = "spg-compare-mobile-result-row";
      if (sourceInput) row.classList.add("spg-compare-mobile-result-row-editable");
      const labelElement = document.createElement("span");
      labelElement.className = "spg-result-label";
      labelElement.textContent = label;
      const valueElement = document.createElement("span");
      valueElement.className = "spg-result-value";
      const referenceElement = document.createElement("span");
      referenceElement.className = "spg-compare-mobile-reference-value";
      if (sourceInput && hasCompareOwnValue(sourceInput)) referenceElement.classList.add("spg-result-value-muted");
      referenceElement.textContent = displayValue;
      valueElement.appendChild(referenceElement);
      if (sourceInput) {
        const mobileInput = document.createElement("input");
        mobileInput.className = "spg-compare-mobile-row-input";
        mobileInput.type = sourceInput.type || "number";
        mobileInput.min = sourceInput.min || "";
        mobileInput.max = sourceInput.max || "";
        mobileInput.step = sourceInput.step || "";
        mobileInput.placeholder = sourceInput.placeholder || "";
        mobileInput.value = sourceInput.value || "";
        mobileInput.setAttribute("aria-label", `${title} ${label}`);
        mobileInput.addEventListener("input", () => {
          sourceInput.value = mobileInput.value;
        });
        mobileInput.addEventListener("change", () => {
          sourceInput.dispatchEvent(new Event("input", { bubbles: true }));
          sourceInput.dispatchEvent(new Event("change", { bubbles: true }));
        });
        valueElement.appendChild(mobileInput);
      }
      if (diffText) {
        const diffElement = document.createElement("span");
        diffElement.className = "spg-compare-cell-difference";
        diffElement.textContent = diffText;
        addCompareDifferenceClass(diffElement, diffText);
        valueElement.appendChild(diffElement);
      }
      row.appendChild(labelElement);
      row.appendChild(valueElement);
      card.appendChild(row);
    });

    return card;
  }

  function renderCompareMobileResults(resultA, resultB, rows) {
    const wrapper = document.createElement("div");
    wrapper.className = "spg-compare-mobile-results";
    wrapper.appendChild(createCompareMobileResultCard(uiText("field.toolA", "Tool A"), getCompareDisplayToolArticle(resultA, "a"), rows, "a"));
    wrapper.appendChild(createCompareMobileResultCard(uiText("field.toolB", "Tool B"), getCompareDisplayToolArticle(resultB, "b"), rows, "b"));
    elements.costData.appendChild(wrapper);
  }

  function renderCompareError(resultA, resultB) {
    const errorsA = resultA && resultA.errors && resultA.errors.length ? resultA.errors.join(" ") : "";
    const errorsB = resultB && resultB.errors && resultB.errors.length ? resultB.errors.join(" ") : "";
    if (!errorsA && !errorsB) return false;
    const messages = [];
    if (errorsA) messages.push(`Tool A: ${errorsA}`);
    if (errorsB) messages.push(`Tool B: ${errorsB}`);
    elements.compareSummary.textContent = messages.join(" ");
    return false;
  }

  function renderCompareSummary(resultA, resultB) {
    elements.compareSummary.textContent = "";
    if (!resultA.costData || !resultB.costData) return;
    const totalA = resultA.costData.totalCostPerThread;
    const totalB = resultB.costData.totalCostPerThread;
    const difference = totalB - totalA;
    if (!Number.isFinite(difference) || difference === 0) {
      elements.compareSummary.textContent = "Both tools have the same calculated total cost per thread.";
      return;
    }
    const winner = difference < 0
      ? `Tool B: ${getCompareResultToolArticle(resultB)}`
      : `Tool A: ${getCompareResultToolArticle(resultA)}`;
    const saving = Math.abs(difference);
    const baseline = difference < 0 ? totalA : totalB;
    const savingPercent = baseline ? Math.round(saving / baseline * 100) : 0;
    elements.compareSummary.textContent = `${winner} saves ${formatCompareCurrency(saving)} per thread (${savingPercent}% lower total cost).`;
  }

  function getCompareResultToolArticle(result) {
    if (!result || !result.tool) return "-";
    if (result.tool.isCustom) return uiText("tool.custom", "Custom tool");
    return result.tool.description || uiText("tool.custom", "Custom tool");
  }

  function getCompareDisplayToolArticle(result, side) {
    const controls = getCompareControls(side);
    if (controls.tool.value === CUSTOM_TOOL_ID) return "Custom tool";
    return getCompareResultToolArticle(result);
  }

  function createCompareHeaderCell(title, article) {
    const cell = document.createElement("span");
    if (!article) {
      cell.textContent = title;
      return cell;
    }
    cell.className = "spg-compare-result-tool-header";
    const titleElement = document.createElement("span");
    titleElement.className = "spg-compare-result-tool-title";
    titleElement.textContent = title;
    const articleElement = document.createElement("span");
    articleElement.className = "spg-compare-result-tool-article";
    articleElement.textContent = article;
    cell.appendChild(titleElement);
    cell.appendChild(articleElement);
    return cell;
  }

  function createCompareResultMainHeader() {
    const cell = document.createElement("span");
    cell.className = "spg-compare-result-main-header";

    const titleElement = document.createElement("span");
    titleElement.className = "spg-compare-result-main-title";
    titleElement.textContent = uiText("compare.result", "Result");
    cell.appendChild(titleElement);

    const copyGroup = document.createElement("span");
    copyGroup.className = "spg-compare-result-copy-group";

    const button = document.createElement("button");
    button.id = "spg-copy-compare-results";
    button.type = "button";
    button.className = "spg-button spg-compare-copy-button";
    button.textContent = uiText("button.copy", "Copy");
    button.addEventListener("click", copyCompareResults);
    copyGroup.appendChild(button);

    const message = document.createElement("span");
    message.id = "spg-compare-copy-message";
    message.className = "spg-copy-message spg-compare-copy-message";
    message.setAttribute("aria-live", "polite");
    copyGroup.appendChild(message);

    cell.appendChild(copyGroup);
    return cell;
  }

  function renderCompareResultTable(resultA, resultB) {
    const header = document.createElement("div");
    header.className = "spg-compare-result-row spg-compare-result-header";
    header.appendChild(createCompareResultMainHeader());
    header.appendChild(createCompareHeaderCell("Tool A", getCompareDisplayToolArticle(resultA, "a")));
    header.appendChild(createCompareHeaderCell("Tool B", getCompareDisplayToolArticle(resultB, "b")));
    elements.costData.appendChild(header);

    const rows = getCompareResultRows(resultA, resultB);
    rows.forEach(([label, leftValue, rightValue, leftInput, rightInput, leftDiff, rightDiff]) => {
      elements.costData.appendChild(createCompareResultRow(label, leftValue, rightValue, {
        leftInput,
        rightInput,
        leftDiff,
        rightDiff,
        editable: Boolean(leftInput || rightInput),
        highlight: Boolean(leftDiff || rightDiff)
      }));
    });
    renderCompareMobileResults(resultA, resultB, rows);
  }

  function addCompareCustomToolError(side, result) {
    const controls = getCompareControls(side);
    if (controls.tool.value !== CUSTOM_TOOL_ID || hasCompleteCompareCustomDimensions(controls)) return;
    result.errors.push(`Enter custom tool dimensions for Tool ${side.toUpperCase()}.`);
  }

  function renderCostData() {
    const activeCompareInputId = getActiveCompareInputId();
    parkCompareInputs();
    currentCompareResults = null;
    elements.costData.innerHTML = "";
    elements.compareSummary.textContent = "";

    const operationInput = getCompareOperationInput();
    const needsThreadLength = !hasCompareThreadLengthInput();
    const candidates = needsThreadLength ? [] : core.filterTools(data, operationInput);
    updateCompareToolOptions(candidates, { needsThreadLength });

    if (needsThreadLength) {
      elements.compareSummary.textContent = uiText("compare.enterThreadLength", "Enter thread length to compare tools.");
      renderCompareResultTable(
        { tool: null, cuttingData: null, costData: null, errors: [] },
        { tool: null, cuttingData: null, costData: null, errors: [] }
      );
      restoreCompareInputFocus(activeCompareInputId);
      return;
    }

    const inputA = getCompareScenarioInput("a", candidates, operationInput);
    const inputB = getCompareScenarioInput("b", candidates, operationInput);
    const resultA = core.calculate(inputA, data);
    const resultB = core.calculate(inputB, data);
    addCompareCustomToolError("a", resultA);
    addCompareCustomToolError("b", resultB);

    updateCompareToolMeta("a", candidates, resultA);
    updateCompareToolMeta("b", candidates, resultB);

    renderCompareError(resultA, resultB);
    currentCompareResults = { resultA, resultB };
    if (!elements.compareSummary.textContent) renderCompareSummary(resultA, resultB);
    renderCompareResultTable(resultA, resultB);
    restoreCompareInputFocus(activeCompareInputId);
  }

  function getComparePitchCopyText() {
    const pitchMode = getPitchMode(elements.compareThreadProfile.value);
    const pitchLabel = pitchMode === "tpi" ? "Threads per inch" : "Pitch";
    const pitchUnit = pitchMode === "tpi" ? "TPI" : "mm";
    return {
      label: pitchLabel,
      value: `${formatCopyInputNumber(elements.comparePitch.value, 3)} ${pitchUnit}`
    };
  }

  function getCompareActiveToolPrice(result, controls) {
    return controls.price.value || getCompareReferenceToolPrice(result);
  }

  function getCompareActiveToolLife(controls) {
    return controls.life.value || getCompareReferenceToolLife();
  }

  function getCompareToolTypeForCopy(result) {
    if (!result || !result.tool) return "-";
    return result.tool.isCustom ? "Custom tool dimensions" : getThreadMillType(result.tool);
  }

  function buildCompareToolCopyLines(label, result, controls) {
    const tool = result && result.tool;
    const toolPageUrl = tool && !tool.isCustom ? getToolPageUrl(tool) : "";
    return [
      label,
      "------",
      `Article: ${getCompareResultToolArticle(result)}`,
      `Type: ${getCompareToolTypeForCopy(result)}`,
      `Cutter diameter: ${tool ? `${formatDimension(tool.cutterDiameter)} mm` : "-"}`,
      `Cutting length: ${tool ? `${formatDimension(tool.cuttingEdgeLength)} mm` : "-"}`,
      `Flutes: ${tool ? formatDecimal(tool.flutes, 0) : "-"}`,
      `Tooling cost: € ${formatDecimal(getCompareActiveToolPrice(result, controls), 2)}`,
      `Tool life: ${formatDecimal(getCompareActiveToolLife(controls), 0)} minutes`,
      ...(toolPageUrl ? [`Tool page: ${toolPageUrl}`] : [])
    ];
  }

  function buildCompareSingleResultLine(label, value, diffText) {
    return `${label}: ${diffText ? `${value} (${diffText})` : value}`;
  }

  function buildCompareToolResultCopyLines(article, rows, side) {
    const isToolA = side === "a";
    return [
      `Article: ${article}`,
      "",
      ...rows.map(([label, leftValue, rightValue, leftInput, rightInput, leftDiff, rightDiff]) => (
        buildCompareSingleResultLine(label, isToolA ? leftValue : rightValue, isToolA ? leftDiff : rightDiff)
      ))
    ];
  }

  function buildCompareResultsCopyText() {
    if (!currentCompareResults || !currentCompareResults.resultA || !currentCompareResults.resultB) return "";
    const resultA = currentCompareResults.resultA;
    const resultB = currentCompareResults.resultB;
    if (!resultA.tool || !resultB.tool || !resultA.cuttingData || !resultB.cuttingData || !resultA.costData || !resultB.costData) return "";

    const controlsA = getCompareControls("a");
    const controlsB = getCompareControls("b");
    const pitchCopy = getComparePitchCopyText();
    const rows = getCompareResultRows(resultA, resultB);

    const lines = [
      "SmiCut Internal Thread Milling Compare",
      "",
      "Thread",
      `Material: ${getSelectedText(elements.compareMaterial)}`,
      `Profile: ${getSelectedText(elements.compareThreadProfile)}`,
      `Size: ${getSelectedText(elements.compareThreadSize)}`,
      `Diameter: ${formatCopyInputNumber(elements.compareDiameter.value, 3)} mm`,
      `${pitchCopy.label}: ${pitchCopy.value}`,
      `Thread length: ${formatCopyInputNumber(elements.compareThreadLength.value, 3)} mm`,
      `Machine cost per hour: € ${formatDecimal(elements.machineCost.value, 2)}`,
      "",
      ...buildCompareToolCopyLines("Tool A", resultA, controlsA),
      "",
      ...buildCompareToolCopyLines("Tool B", resultB, controlsB),
      "",
      "Tool A Results",
      "--------------",
      ...buildCompareToolResultCopyLines(getCompareResultToolArticle(resultA), rows, "a"),
      "",
      "Tool B Results",
      "--------------",
      ...buildCompareToolResultCopyLines(getCompareResultToolArticle(resultB), rows, "b")
    ];

    return lines.join("\n");
  }

  function renderProgram(result) {
    if (!result.input.threadLength) {
      elements.cncProgram.value = "";
      elements.cncProgram.style.setProperty("height", "198px", "important");
      return;
    }
    elements.cncProgram.value = result.cncProgram.join("\n");
    const lineHeightPx = 19;
    const targetHeight = Math.min(560, Math.max(198, 42 + (result.cncProgram.length * lineHeightPx)));
    elements.cncProgram.style.setProperty("height", `${targetHeight}px`, "important");
  }

  function updateNote(result) {
    if (!result.input.threadLength) {
      setNote(uiText("note.enterThreadLength", "Enter thread length to select a matching tool."));
      return;
    }
    if (!result.input.diameter || !result.input.pitch) {
      setNote(uiText("note.enterThreadGeometry", "Enter thread diameter, pitch and thread length."));
      return;
    }
    if (!result.tool) {
      setNote(uiText("note.noMatchingTool", "No matching tool was found for the selected thread and thread length."));
      return;
    }
    if (result.errors.length) {
      setNote(result.errors.join(" "));
      return;
    }
    if (!result.canGenerateCncProgram) {
      setNote(result.cncProgram.join(" "));
      return;
    }
    setNote("");
  }

  function recalculate(options) {
    const input = getInput();
    const needsThreadLength = !hasThreadLengthInput();
    const preCandidates = needsThreadLength ? [] : core.filterTools(data, input);
    if (!options || !options.keepTool) {
      updateToolOptions(preCandidates, input.selectedToolId, { needsThreadLength });
    }
    if (!isCustomToolSelected()) {
      const selected = preCandidates.find(tool => String(tool.id) === elements.tool.value);
      const nextId = selected ? String(selected.id) : "";
      if (nextId !== diameterToolId) {
        diameterToolId = nextId;
        catalogueDiameter = selected ? formatNumberInput(selected.cutterDiameter, 2) : "";
        elements.markedDiameter.value = catalogueDiameter.replace(".", ",");
        requestedToolId = nextId;
      }
      elements.markedDiameter.disabled = !selected;
      elements.resetDiameter.disabled = !selected;
    } else {
      diameterToolId = "";
    }
    const result = core.calculate(getInput(), data);
    currentResult = result;
    renderTool(result);
    renderCuttingData(result);
    renderProgram(result);
    renderCostData(result);
    updateNote(result);
  }

  function buildCuttingDataCopyText() {
    if (!currentResult || !currentResult.tool || !currentResult.cuttingData) {
      return "";
    }

    const tool = currentResult.tool;
    const c = currentResult.cuttingData;
    const toolPageUrl = getToolPageUrl(tool);
    const pitchMode = getPitchMode(elements.threadProfile.value);
    const pitchLabel = pitchMode === "tpi" ? "Threads per inch" : "Pitch";
    const pitchUnit = pitchMode === "tpi" ? "TPI" : "mm";
    const threadPitchText = `${formatCopyInputNumber(elements.pitch.value, 3)} ${pitchUnit}`;
    const lines = [
      "SmiCut Internal Thread Milling",
      "",
      "Thread",
      `Material: ${getSelectedText(elements.material)}`,
      `Profile: ${getSelectedText(elements.threadProfile)}`,
      `Size: ${getSelectedText(elements.threadSize)}`,
      `Diameter: ${formatCopyInputNumber(elements.diameter.value, 3)} mm`,
      `${pitchLabel}: ${threadPitchText}`,
      `Thread length: ${formatCopyInputNumber(elements.threadLength.value, 3)} mm`,
      "",
      "Thread Mill",
      `Article: ${tool.description || "-"}`,
      `Type: ${getThreadMillType(tool)}`,
      `Tool pitch: ${threadPitchText}`,
      `Cutter diameter: ${formatDimension(tool.cutterDiameter)} mm`,
      `Cutting length: ${formatDimension(tool.cuttingEdgeLength)} mm`,
      `Flutes: ${tool.flutes || "-"}`,
      ...(toolPageUrl ? [`Tool page: ${toolPageUrl}`] : []),
      "",
      "Cutting Data",
      `Cutting speed Vc: ${core.fmt(c.cuttingSpeed, 0)} m/min`,
      `Feed per tooth fz: ${formatDecimal(c.feedPerTooth, 3)} mm/tooth`,
      `Radial passes: ${c.radialPasses}`,
      `Axial passes: ${c.axialPasses}`,
      `Spindle speed n: ${core.fmt(c.spindleSpeed, 0)} rpm`,
      `Feed at thread diameter FD: ${core.fmt(c.feedAtThreadDiameter, 0)} mm/min`,
      `Feed in center of mill Fd: ${core.fmt(c.centerFeed, 0)} mm/min`,
      `Machining time: ${formatMachiningSeconds(c.machiningTime)} seconds`
    ];

    return lines.join("\n");
  }

  function buildCncProgramCopyText() {
    const cncProgram = elements.cncProgram.value.trim();
    if (!cncProgram) return "";

    const processText = getSelectedText(elements.process);
    const controlSystemText = getSelectedText(elements.controlSystem);
    const threadHandText = getSelectedText(elements.threadHand);
    return [
      `CNC Program for ${processText}`,
      `Control system: ${controlSystemText}`,
      `Thread direction: ${threadHandText}`,
      "",
      cncProgram
    ].join("\n");
  }

  function setActiveTab(tabName) {
    elements.tabs.forEach((tab) => {
      const active = tab.dataset.spgTab === tabName;
      tab.classList.toggle("spg-tab-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    [
      [elements.startPanel, "start"],
      [elements.materialSelectorPanel, "materialselector"],
      [elements.mainPanel, "main"],
      [elements.comparePanel, "compare"],
      [elements.informationPanel, "information"]
    ].forEach(([panel, name]) => {
      const active = tabName === name;
      panel.classList.toggle("spg-panel-active", active);
      panel.hidden = !active;
    });

    if (tabName === "materialselector") initMaterialSelector();
  }

  function unlockCompare() {
    if (elements.comparePassword.value.trim().toLowerCase() !== core.COMPARE_PASSWORD.toLowerCase()) {
      setNote("Wrong compare password.");
      return;
    }
    compareUnlocked = true;
    elements.compareLock.hidden = true;
    elements.compareContent.hidden = false;
    setNote("Compare is unlocked for this browser session.");
    recalculate({ keepTool: true });
  }

  async function copyCncProgram() {
    elements.copyMessage.textContent = "";
    elements.cuttingDataCopyMessage.textContent = "";
    const compareCopyMessage = document.getElementById("spg-compare-copy-message");
    if (compareCopyMessage) compareCopyMessage.textContent = "";
    const text = buildCncProgramCopyText();
    try {
      await navigator.clipboard.writeText(text);
      elements.copyMessage.textContent = uiText("copy.copied", "copied");
    } catch (error) {
      elements.cncProgram.focus();
      elements.cncProgram.select();
      elements.copyMessage.textContent = uiText("copy.failed", "copy failed");
    }
  }

  async function copyCuttingData() {
    elements.cuttingDataCopyMessage.textContent = "";
    elements.copyMessage.textContent = "";
    const compareCopyMessage = document.getElementById("spg-compare-copy-message");
    if (compareCopyMessage) compareCopyMessage.textContent = "";
    const text = buildCuttingDataCopyText();
    if (!text) {
      elements.cuttingDataCopyMessage.textContent = uiText("copy.noData", "no data");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      elements.cuttingDataCopyMessage.textContent = uiText("copy.copied", "copied");
    } catch (error) {
      elements.cuttingDataCopyMessage.textContent = uiText("copy.failed", "copy failed");
    }
  }

  async function copyCompareResults() {
    const compareCopyMessage = document.getElementById("spg-compare-copy-message");
    if (compareCopyMessage) compareCopyMessage.textContent = "";
    elements.cuttingDataCopyMessage.textContent = "";
    elements.copyMessage.textContent = "";
    const text = buildCompareResultsCopyText();
    if (!text) {
      if (compareCopyMessage) compareCopyMessage.textContent = uiText("copy.noData", "no data");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      if (compareCopyMessage) compareCopyMessage.textContent = uiText("copy.copied", "copied");
    } catch (error) {
      if (compareCopyMessage) compareCopyMessage.textContent = uiText("copy.failed", "copy failed");
    }
  }

  function bindRecalculateEvents(element, callback) {
    if (!element) return;
    const handler = callback || (() => recalculate());
    element.addEventListener("input", handler);
    element.addEventListener("change", handler);
  }

  function bindChangeRecalculateEvent(element, callback) {
    if (!element) return;
    element.addEventListener("change", callback || (() => recalculate()));
  }

  function clampCompareRadialPassInput(input) {
    if (!input || input.value === "") return;
    const numericValue = Math.round(Number(input.value));
    input.value = String(Math.min(3, Math.max(1, Number.isFinite(numericValue) ? numericValue : 1)));
  }

  function bindEvents() {
    bindRecalculateEvents(elements.markedDiameter);
    elements.resetDiameter.addEventListener("click", () => {
      elements.markedDiameter.value = catalogueDiameter.replace(".", ",");
      recalculate({ keepTool: true });
    });
    const compareOwnValueInputs = [
      elements.compareToolAPrice,
      elements.compareToolALife,
      elements.compareToolADiameter,
      elements.compareToolALength,
      elements.compareToolAFlutes,
      elements.compareToolASpeed,
      elements.compareToolAFeed,
      elements.compareToolAPasses,
      elements.compareToolBPrice,
      elements.compareToolBLife,
      elements.compareToolBDiameter,
      elements.compareToolBLength,
      elements.compareToolBFlutes,
      elements.compareToolBSpeed,
      elements.compareToolBFeed,
      elements.compareToolBPasses
    ];

    [
      elements.process,
      elements.controlSystem,
      elements.threadHand,
      elements.programTemplate,
      elements.material,
      elements.threadLength,
      elements.safetyDistance,
      elements.overrideCutterDiameter,
      elements.overrideEdgeLength,
      elements.overrideFlutes,
      elements.overrideCuttingSpeed,
      elements.overrideFeed,
      elements.overrideRadialPasses
    ].forEach((element) => bindRecalculateEvents(element));

    [
      elements.machineCost,
      ...compareOwnValueInputs.filter((element) => element !== elements.compareToolAPasses && element !== elements.compareToolBPasses)
    ].forEach((element) => bindChangeRecalculateEvent(element, () => recalculate({ keepTool: true })));

    [
      elements.compareMaterial,
      elements.compareThreadLength
    ].forEach((element) => bindRecalculateEvents(element, () => recalculate({ keepTool: true })));

    compareOwnValueInputs.forEach((element) => {
      if (element) element.addEventListener("change", () => syncCompareOwnInputReferenceState(element));
    });

    [elements.diameter, elements.pitch].forEach((element) => {
      element.addEventListener("input", () => {
        syncThreadSizeFromDimensions();
        recalculate();
      });
      element.addEventListener("change", () => {
        syncThreadSizeFromDimensions();
        recalculate();
      });
    });

    elements.threadSize.addEventListener("change", () => {
      applyThreadSizeSelection();
      recalculate();
    });
    [elements.compareDiameter, elements.comparePitch].forEach((element) => {
      element.addEventListener("input", () => {
        syncThreadSizeFromDimensions(getCompareThreadControls());
        recalculate({ keepTool: true });
      });
      element.addEventListener("change", () => {
        syncThreadSizeFromDimensions(getCompareThreadControls());
        recalculate({ keepTool: true });
      });
    });
    elements.compareThreadSize.addEventListener("change", () => {
      applyThreadSizeSelection(getCompareThreadControls());
      recalculate({ keepTool: true });
    });
    elements.compareThreadProfile.addEventListener("input", handleCompareThreadProfileChange);
    elements.compareThreadProfile.addEventListener("change", handleCompareThreadProfileChange);
    elements.tool.addEventListener("change", () => {
      requestedToolId = elements.tool.value;
      if (isCustomToolSelected()) {
        const baseTool = currentResult && currentResult.tool && !currentResult.tool.isCustom ? currentResult.tool : null;
        if (baseTool) {
          customBaseToolId = String(baseTool.id);
          fillCustomToolFromTool(baseTool);
        }
      } else {
        customBaseToolId = elements.tool.value;
      }
      updateCustomToolVisibility();
      recalculate({ keepTool: true });
    });
    elements.threadProfile.addEventListener("input", handleThreadProfileChange);
    elements.threadProfile.addEventListener("change", handleThreadProfileChange);
    elements.overrideRadialPasses.addEventListener("change", () => {
      clampRadialPassInput();
      recalculate();
    });
    [elements.compareToolAPasses, elements.compareToolBPasses].forEach((element) => {
      element.addEventListener("change", () => {
        clampCompareRadialPassInput(element);
        recalculate({ keepTool: true });
      });
    });
    elements.compareToolA.addEventListener("change", () => {
      const previousToolId = compareToolAId;
      compareToolAId = elements.compareToolA.value;
      if (compareToolAId === CUSTOM_TOOL_ID && previousToolId && previousToolId !== CUSTOM_TOOL_ID) {
        compareToolACustomBaseId = previousToolId;
      } else if (compareToolAId !== CUSTOM_TOOL_ID) {
        compareToolACustomBaseId = compareToolAId;
      }
      recalculate({ keepTool: true });
    });
    elements.compareToolB.addEventListener("change", () => {
      const previousToolId = compareToolBId;
      compareToolBId = elements.compareToolB.value;
      if (compareToolBId === CUSTOM_TOOL_ID && previousToolId && previousToolId !== CUSTOM_TOOL_ID) {
        compareToolBCustomBaseId = previousToolId;
      } else if (compareToolBId !== CUSTOM_TOOL_ID) {
        compareToolBCustomBaseId = compareToolBId;
      }
      recalculate({ keepTool: true });
    });
    elements.copyCuttingData.addEventListener("click", copyCuttingData);
    elements.copyCnc.addEventListener("click", copyCncProgram);
    elements.unlockCompare.addEventListener("click", unlockCompare);
    elements.comparePassword.addEventListener("keydown", (event) => {
      if (event.key === "Enter") unlockCompare();
    });
    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => setActiveTab(tab.dataset.spgTab));
    });
    elements.startButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.spgStartTab));
    });

  }

  function init() {
    i18n.apply(document.getElementById("smiprog-app"));
    const visibleControlSystems = core.getVisibleControlSystems(data);
    fillSelect(elements.process, data.processes, "machining-center", (item) => item.id, (item) => item.label);
    fillSelect(elements.controlSystem, visibleControlSystems, "fanuc", (item) => item.id, (item) => item.label);
    fillThreadProfileSelect(elements.threadProfile, "m");
    fillThreadProfileSelect(elements.compareThreadProfile, "m");
    fillSelect(elements.material, data.materials, "material-14", (item) => item.id, (_item, index) => getMaterialLabelByIndex(index));
    fillSelect(elements.compareMaterial, data.materials, "material-14", (item) => item.id, (_item, index) => getMaterialLabelByIndex(index));
    currentPitchMode = updatePitchField(getMainThreadControls());
    currentComparePitchMode = updatePitchField(getCompareThreadControls());
    updateThreadSizeOptions(undefined, getMainThreadControls());
    updateThreadSizeOptions(undefined, getCompareThreadControls());
    applyThreadSizeSelection();
    applyThreadSizeSelection(getCompareThreadControls());
    elements.threadLength.value = "12";
    bindEvents();
    initMaterialSelector();
    recalculate();
    if (!compareUnlocked) {
      elements.compareLock.hidden = false;
      elements.compareContent.hidden = true;
    }
  }

  if (!data || !core) {
    throw new Error("SmiProg data or core module is missing.");
  }

  init();
})(window);
