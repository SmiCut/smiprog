/*
 * SmiProg Calculation Core
 * Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 */

(function attachSmiProgCore(global) {
  "use strict";

  const F3_TABLE = [
    [0.1, 0.0031863081771035654],
    [0.41119573041066543, 0.0035049389948139222],
    [0.47287508997226518, 0.0038554328942953147],
    [0.54380635346810491, 0.0042409761837248466],
    [0.62537730648832057, 0.0046650738020973317],
    [0.7191839024615686, 0.0051315811823070649],
    [0.8270614878308038, 0.0056447393005377719],
    [0.95112071100542428, 0.0062092132305915492],
    [1.0937888176562378, 0.006830134553650705],
    [1.2578571403046734, 0.0075131480090157758],
    [1.4465357113503743, 0.008264462809917354],
    [1.6635160680529304, 0.009090909090909091],
    [1.9130434782608698, 0.01],
    [2.2, 0.011],
    [2.4420000000000006, 0.0121],
    [2.7106200000000009, 0.01331],
    [3.0087882000000015, 0.014641],
    [3.3397549020000019, 0.0161051],
    [3.7071279412200027, 0.01771561],
    [4.1149120147542035, 0.019487171],
    [4.5675523363771662, 0.0214358881],
    [5.0699830933786547, 0.02357947691],
    [5.627681233650307, 0.025937424601],
    [6.2467261693518417, 0.0285311670611],
    [6.933866047980545, 0.031384283767210024],
    [7.6965913132584056, 0.03452271214393103],
    [8.543216357716831, 0.03797498335832414],
    [9.482970157065683, 0.04177248169415655],
    [10.52609687434291, 0.04594972986357221],
    [11.683967530520631, 0.050544702849929436],
    [12.969203958877902, 0.05559917313492344],
    [14.395816394354473, 0.06115909044841463],
    [15.979356197733466, 0.0672749994932561],
    [17.737085379484149, 0.07400249944258172],
    [19.688164771227406, 0.0814027493868399],
    [21.853862896062424, 0.0895430243255239],
    [24.257787814629292, 0.09849732675807629]
  ];

  const GEOMETRY_HEIGHT_THRESHOLDS = [
    0.005,
    0.057,
    0.06498,
    0.0740772,
    0.08444800799999999,
    0.09627072911999998,
    0.10974863119679996,
    0.12511343956435195,
    0.1426293211033612,
    0.16259742605783176
  ];

  const GEOMETRY_LENGTH_THRESHOLDS = [
    0.1,
    1.135,
    1.288225,
    1.462135375,
    1.659523650625,
    1.883559343459375,
    2.1378398548263906,
    2.4264482352279533,
    2.754018746983727,
    3.1258112778265303,
    3.547795800333112,
    4.026748233378083
  ];

  const GEOMETRY_FACTOR_MATRIX = [
    [1.75, 1.5909090909090908, 1.446280991735537, 1.3148009015777609, 1.1952735468888733, 1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482],
    [1.5909090909090908, 1.446280991735537, 1.3148009015777609, 1.1952735468888733, 1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802],
    [1.446280991735537, 1.3148009015777609, 1.1952735468888733, 1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365],
    [1.3148009015777609, 1.1952735468888733, 1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124],
    [1.1952735468888733, 1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036],
    [1.0866123153535212, 0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396],
    [0.9878293775941102, 0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597],
    [0.8980267069037364, 0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597, 0.38085098763275993],
    [0.816387915367033, 0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597, 0.38085098763275993, 0.34622817057523625],
    [0.7421708321518482, 0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597, 0.38085098763275993, 0.34622817057523625, 0.31475288234112386],
    [0.6747007565016802, 0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597, 0.38085098763275993, 0.34622817057523625, 0.31475288234112386, 0.2861389839464762],
    [0.6133643240924365, 0.557603930993124, 0.5069126645392036, 0.4608296950356396, 0.41893608639603597, 0.38085098763275993, 0.34622817057523625, 0.31475288234112386, 0.2861389839464762, 0.26012634904225107]
  ];

  const MICRO_GEOMETRY_LENGTH_THRESHOLDS = [
    0.1,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5,
    5.5,
    6,
    6.5,
    7
  ];

  const MICRO_GEOMETRY_FACTOR_MATRIX = [
    [4, 3.6363636363636362, 3.3057851239669418, 3.0052592036063106, 2.7320538214602821, 2.4836852922366197, 2.2578957202151084, 2.0526324729228258, 1.8660295208389324, 1.6963904734899384],
    [3.883495145631068, 3.5304501323918798, 3.2095001203562541, 2.9177273821420489, 2.6524794383109533, 2.4113449439190484, 2.1921317671991343, 1.9928470610901221, 1.8116791464455653, 1.6469810422232412],
    [3.7703836365350174, 3.4276214877591067, 3.1160195343264601, 2.8327450312058726, 2.5752227556417022, 2.3411115960379112, 2.1282832691253732, 1.9348029719321573, 1.7589117926655973, 1.5990107206050885],
    [3.660566637412638, 3.3277878521933073, 3.0252616838120971, 2.7502378943746337, 2.5002162676133031, 2.2729238796484572, 2.0662944360440516, 1.8784494873127742, 1.7076813521025216, 1.5524375928204743],
    [3.5539481916627551, 3.2308619924206865, 2.9371472658369875, 2.6701338780336248, 2.4273944345760223, 2.2067222132509294, 2.0061111029553897, 1.8237373663230816, 1.6579430602937102, 1.5072209639033731],
    [3.4504351375366555, 3.1367592159424138, 2.8515992872203761, 2.5923629883821597, 2.3566936258019635, 2.1424487507290575, 1.9476806824809609, 1.770618802255419, 1.6096534565958351, 1.4633213241780321],
    [3.3499370267346169, 3.0453972970314696, 2.7685429973013358, 2.5168572702739413, 2.2880520638854014, 2.0800473308049101, 1.8909521189135543, 1.7190473808305038, 1.5627703462095486, 1.4207003147359534],
    [3.2523660453734142, 2.956696404884922, 2.687905822622656, 2.4435507478387781, 2.2214097707625258, 2.019463427965932, 1.8358758436053926, 1.6689780396412657, 1.5172527633102413, 1.3793206939184013],
    [3.157636937255742, 2.8705790338688564, 2.6096173035171417, 2.3723793668337652, 2.1567085153034231, 1.9606441048212933, 1.7824037316557209, 1.6203670287779277, 1.4730609352526614, 1.3391463047751468],
    [3.0656669293745069, 2.786969935795006, 2.5336090325409142, 2.3032809386735584, 2.0938917624305078, 1.9035379658459157, 1.7304890598599232, 1.5731718725999297, 1.4301562478181178, 1.3001420434710163],
    [2.9763756595868998, 2.7057960541699084, 2.4598145946999166, 2.2361950860908335, 2.0329046237189394, 1.8480951124717628, 1.6800864658834205, 1.5273513326212911, 1.3885012114739008, 1.2622738286126371],
    [2.8896851063950484, 2.6269864603591344, 2.3881695094173945, 2.1710631903794502, 1.9736938094358634, 1.7942670994871484, 1.63115190862468, 1.4828653714769815, 1.3480594286154377, 1.2255085714685798]
  ];

  const EDGE_LENGTH_FACTOR_TABLE = [
    [0.03, 0.5],
    [0.25, 0.6332511891367892],
    [0.26, 0.6528362774606075],
    [0.28, 0.6730270901655747],
    [0.29, 0.6938423609954378],
    [0.31, 0.7153014030880802],
    [0.33, 0.7374241268949281],
    [0.36, 0.7602310586545651],
    [0.38, 0.783743359437696],
    [0.42, 0.8079828447811299],
    [0.45, 0.832972004929],
    [0.5, 0.8587340257],
    [0.56, 0.88529281],
    [0.63, 0.912673],
    [0.71, 0.9409],
    [0.83, 0.97],
    [1, 1],
    [1.2, 0.97],
    [1.4, 0.9409],
    [1.6, 0.912673],
    [1.8, 0.88529281],
    [2, 0.8587340257],
    [2.2, 0.832972004929],
    [2.4, 0.8079828447811299],
    [2.6, 0.783743359437696],
    [2.8, 0.7602310586545651],
    [3, 0.7374241268949281],
    [3.2, 0.7153014030880802],
    [3.4, 0.6938423609954378],
    [3.6, 0.6730270901655747],
    [3.8, 0.6528362774606075],
    [4, 0.6332511891367892],
    [10, 0.5]
  ];

  const COMPARE_PASSWORD = "XL";

  function toNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function optionalRadialPasses(value) {
    const number = optionalNumber(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return Math.min(3, Math.max(1, Math.round(number)));
  }

  function isPositiveFiniteNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  function isNonNegativeFiniteNumber(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function round(value, decimals) {
    const factor = Math.pow(10, decimals || 0);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function lookupFloor(value, table) {
    let current = table[0][1];
    for (let i = 0; i < table.length; i += 1) {
      if (value >= table[i][0]) {
        current = table[i][1];
      } else {
        break;
      }
    }
    return current;
  }

  function lookupFloorIndex(value, thresholds) {
    let current = 0;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (value >= thresholds[i]) {
        current = i;
      } else {
        break;
      }
    }
    return current;
  }

  function fmt(value, decimals) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "-";
    }
    return round(value, decimals).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function isSameNumber(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.000001;
  }

  function findMaterial(data, materialId) {
    return data.materials.find((material) => material.id === materialId) || data.materials[0];
  }

  function findThreadProfile(data, threadProfileId) {
    return data.threadProfiles.find((profile) => profile.id === threadProfileId) || data.threadProfiles[0];
  }

  function findControlSystem(data, controlSystemId) {
    return (data.controlSystems || []).find((control) => control.id === controlSystemId) || null;
  }

  function isReleasedControlSystem(control) {
    return Boolean(control && ["released", "timoApproved", "machineProven"].includes(control.releaseStatus));
  }

  function isVisibleControlSystem(control) {
    return Boolean(control && (control.uiVisible === true || isReleasedControlSystem(control)));
  }

  function canUseControlSystemPost(control) {
    return isVisibleControlSystem(control);
  }

  function getReleasedControlSystems(data) {
    return (data.controlSystems || []).filter(isReleasedControlSystem);
  }

  function getVisibleControlSystems(data) {
    return (data.controlSystems || []).filter(isVisibleControlSystem);
  }

  function filterTools(data, input) {
    const profile = findThreadProfile(data, input.threadProfileId);
    const candidates = data.tools.filter((tool) => {
      if (!tool.description || !tool.minThreadDiameter || !tool.cuttingEdgeLength) {
        return false;
      }
      return tool.minThreadDiameter <= input.diameter &&
        isSameNumber(tool.pitch, input.pitch) &&
        tool.cuttingEdgeLength >= input.threadLength &&
        Number(tool.threadProfileCode) === Number(profile.excelId);
    });

    return candidates.sort((a, b) => b.id - a.id);
  }

  function getSelectedTool(candidates, selectedToolId) {
    if (!candidates.length) {
      return null;
    }
    return candidates.find((tool) => String(tool.id) === String(selectedToolId)) || candidates[0];
  }

  function hasCustomTool(overrides) {
    return Boolean(overrides.cutterDiameter && overrides.cuttingEdgeLength && overrides.flutes);
  }

  function getEffectiveTool(candidates, selectedToolId, overrides) {
    const selectedTool = getSelectedTool(candidates, selectedToolId);
    if (!hasCustomTool(overrides)) {
      // A measured diameter adjusts the catalogue tool without replacing its identity.
      if (selectedTool && overrides.cutterDiameter !== null) {
        return { ...selectedTool, cutterDiameter: overrides.cutterDiameter };
      }
      return selectedTool;
    }

    return {
      id: selectedTool ? selectedTool.id : "custom",
      imageCode: selectedTool ? selectedTool.imageCode : null,
      typeCode: selectedTool ? selectedTool.typeCode : 1,
      threadProfileCode: selectedTool ? selectedTool.threadProfileCode : null,
      description: selectedTool ? `${selectedTool.description} (custom values)` : "Custom tool",
      shankDiameter: selectedTool ? selectedTool.shankDiameter : overrides.cutterDiameter,
      cutterDiameter: overrides.cutterDiameter,
      flutes: overrides.flutes,
      pitch: selectedTool ? selectedTool.pitch : null,
      cuttingEdgeLength: overrides.cuttingEdgeLength,
      overallLength: selectedTool ? selectedTool.overallLength : null,
      minThreadDiameter: selectedTool ? selectedTool.minThreadDiameter : null,
      priceEur: selectedTool ? selectedTool.priceEur : 0,
      isCustom: true
    };
  }

  function getAxialPasses(threadLength, cuttingEdgeLength, pitch, maxPasses) {
    const usableLength = cuttingEdgeLength + 0.001;
    const fullTeeth = Math.max(1, Math.floor(usableLength / pitch));
    const axialMove = fullTeeth * pitch;
    const passLimit = maxPasses || 10;
    let passes = 1;
    let threshold = usableLength;

    while (passes < passLimit && threadLength >= threshold) {
      passes += 1;
      threshold += axialMove;
    }

    return passes;
  }

  function getProgramPitch(input) {
    return input.programPitch || input.pitch;
  }

  function getAxialMove(tool, input) {
    const pitch = getProgramPitch(input);
    const usableLength = tool.cuttingEdgeLength + 0.001;
    return Math.max(1, Math.floor(usableLength / pitch)) * pitch;
  }

  function getMatrixGeometryFactor(input, tool, threadProfile, lengthThresholds, factorMatrix, useEdgeLengthFactor) {
    const pitch = getProgramPitch(input);
    const threadHeightRatio = (0.54 * pitch) / tool.cutterDiameter;
    const availableEdgeLength = Math.min(input.threadLength, tool.cuttingEdgeLength);
    const lengthRatio = availableEdgeLength / tool.cutterDiameter;
    const heightIndex = lookupFloorIndex(threadHeightRatio, GEOMETRY_HEIGHT_THRESHOLDS);
    const lengthIndex = lookupFloorIndex(lengthRatio, lengthThresholds);
    const baseFactor = factorMatrix[lengthIndex][heightIndex];
    const edgeLengthRatio = tool.cuttingEdgeLength / input.threadLength;
    const edgeLengthFactor = useEdgeLengthFactor ? lookupFloor(edgeLengthRatio, EDGE_LENGTH_FACTOR_TABLE) : 1;
    const pipeThreadPenalty = [5, 6, 7].includes(Number(threadProfile.excelId)) ? 0.67 : 1;
    return baseFactor * edgeLengthFactor * pipeThreadPenalty;
  }

  function getGeometryFactor(input, tool, threadProfile) {
    return getMatrixGeometryFactor(input, tool, threadProfile, GEOMETRY_LENGTH_THRESHOLDS, GEOMETRY_FACTOR_MATRIX, true);
  }

  function getMicroGeometryFactor(input, tool, threadProfile) {
    const pitch = getProgramPitch(input);
    const threadHeightRatio = (0.54 * pitch) / tool.cutterDiameter;
    const lengthRatio = tool.cuttingEdgeLength / tool.cutterDiameter;
    const heightIndex = lookupFloorIndex(threadHeightRatio, GEOMETRY_HEIGHT_THRESHOLDS);
    const lengthIndex = lookupFloorIndex(lengthRatio, MICRO_GEOMETRY_LENGTH_THRESHOLDS);
    const pipeThreadPenalty = [5, 6, 7].includes(Number(threadProfile.excelId)) ? 0.67 : 1;
    return MICRO_GEOMETRY_FACTOR_MATRIX[lengthIndex][heightIndex] * pipeThreadPenalty;
  }

  function getRadialPasses(material, tool, input, threadProfile) {
    if (isMicroTool(input, tool)) {
      return 1;
    }

    const load = (material.feedFactor || 1) * getGeometryFactor(input, tool, threadProfile);
    if (load >= 0.55) return 1;
    if (load >= 0.35) return 2;
    return 3;
  }

  function getFeedPerTooth(material, tool, radialPasses, threadProfile, input) {
    const f3 = lookupFloor(tool.cutterDiameter, F3_TABLE);
    const geometryFactor = isMicroTool(input, tool)
      ? getMicroGeometryFactor(input, tool, threadProfile)
      : getGeometryFactor(input, tool, threadProfile);
    const passFactor = radialPasses === 1 ? 1 : radialPasses === 2 ? 1.6 : 2;
    return (material.feedFactor || 1) * f3 * geometryFactor * passFactor;
  }

  function getPassRadii(fullRadius, radialPasses) {
    if (radialPasses <= 1) return [fullRadius];
    if (radialPasses === 2) return [fullRadius * 0.7144, fullRadius];
    return [fullRadius * 0.568, fullRadius * 0.828, fullRadius];
  }

  function formatGCodeNumber(value, decimals) {
    const rounded = round(value, decimals);
    if (Object.is(rounded, -0)) return "0.";
    const text = rounded.toFixed(decimals);
    return text.replace(/\.?0+$/, (match) => match.startsWith(".") ? "." : "");
  }

  function formatHeidenhainNumber(value, decimals) {
    const precision = decimals === undefined ? 3 : decimals;
    const rounded = round(value, precision);
    if (Object.is(rounded, -0)) return "0";
    const text = rounded.toFixed(precision);
    return precision === 0 ? text : text.replace(/\.?0+$/, "");
  }

  function formatHeidenhainSigned(value, decimals) {
    const rounded = round(value, decimals === undefined ? 3 : decimals);
    const sign = rounded >= 0 || Object.is(rounded, 0) ? "+" : "";
    return `${sign}${formatHeidenhainNumber(rounded, decimals)}`;
  }

  function formatHeidenhainForcedPlus(value, decimals) {
    return `+${formatHeidenhainNumber(value, decimals)}`;
  }

  function formatHeidenhainAxis(axis, value, decimals) {
    return `${axis}${formatHeidenhainSigned(value, decimals)}`;
  }

  function formatFanucInitialRapidZ(depth) {
    return formatGCodeNumber(-depth, 3);
  }

  function isMicroTool(input, tool) {
    return Number(tool.typeCode) === 2 ||
      round(tool.cuttingEdgeLength, 3) === round(getProgramPitch(input), 3);
  }

  function getMicroAxialPasses(input) {
    // CNC!AV47-AV48 subtract 0.001 revolutions, not 0.001 mm.
    return Math.max(1, Math.floor(input.threadLength / getProgramPitch(input) - 0.001) + 1);
  }

  function getMicroTwoPassDiameters(input, tool) {
    const firstDiameter = round(input.diameter - (2 * 0.33 * (0.54 * getProgramPitch(input))), 2);
    return [firstDiameter, input.diameter];
  }

  function getFanucThreadAngle(input) {
    // CNC!AV92: profile-specific half angles, also used by the Klartext post.
    const degrees = ["g", "bspt"].includes(input.threadProfileId) ? 27.5
      : input.threadProfileId === "pg" ? 40 : 30;
    return degrees * Math.PI / 180;
  }

  function getFanucThreadHeight(input) {
    return 0.54 * getProgramPitch(input);
  }

  function getFanucTaperStep(input) {
    return round(Math.tan(1.783 * Math.PI / 180) * getProgramPitch(input) / 4, 3);
  }

  function getFanucRadialPassDiameters(input, passCount) {
    const threadHeight = getFanucThreadHeight(input);
    if (passCount <= 1) {
      return [input.diameter];
    }
    if (passCount === 2) {
      return [
        round(input.diameter - (2 * 0.33 * threadHeight), 2),
        input.diameter
      ];
    }
    return [
      round(input.diameter - (2 * 0.5 * threadHeight), 2),
      round(input.diameter - (2 * 0.2 * threadHeight), 2),
      input.diameter
    ];
  }

  function getFanucStartCompensation(input, radialPasses) {
    const passDiameters = getFanucRadialPassDiameters(input, radialPasses);
    const firstRadialStock = (input.diameter - passDiameters[0]) / 2;
    return round(firstRadialStock * Math.tan(getFanucThreadAngle(input)), 3);
  }

  function getFanucInterPassCompensations(passDiameters, input) {
    const angle = getFanucThreadAngle(input);
    const totalCompensation = round(((passDiameters[passDiameters.length - 1] - passDiameters[0]) / 2) * Math.tan(angle), 3);
    const compensations = [];
    for (let index = 0; index < passDiameters.length - 1; index += 1) {
      if (index === passDiameters.length - 2) {
        const usedCompensation = compensations.reduce((sum, value) => sum + value, 0);
        compensations.push(round(totalCompensation - usedCompensation, 3));
      } else {
        compensations.push(round(((passDiameters[index + 1] - passDiameters[index]) / 2) * Math.tan(angle), 3));
      }
    }
    return compensations;
  }

  function isLeftHandThread(input) {
    return input.threadHand === "left";
  }

  function formatFanucHelixZ(input, value) {
    return formatGCodeNumber(value * (isLeftHandThread(input) ? -1 : 1), 3);
  }

  function getFanucThreadStartDepth(input, radialPasses, travelPerPass) {
    const startCompensation = getFanucStartCompensation(input, radialPasses);
    const rightHandDepth = round(input.threadLength + input.safetyDistance - startCompensation, 3);
    return isLeftHandThread(input)
      ? round(rightHandDepth - travelPerPass, 3)
      : rightHandDepth;
  }

  function getFanucInterPassRetract(input, travelPerPass, compensation) {
    return isLeftHandThread(input)
      ? round(travelPerPass - compensation, 3)
      : -round(travelPerPass + compensation, 3);
  }

  function getFanucFinalRetract(input, travelPerPass) {
    return isLeftHandThread(input)
      ? round(input.threadLength + input.safetyDistance, 3)
      : round(input.threadLength + input.safetyDistance - travelPerPass, 3);
  }

  function getMachiningTime(input, tool, cuttingData) {
    const passDiameters = getFanucRadialPassDiameters(input, cuttingData.radialPasses);
    const sum = passDiameters.reduce((total, diameter) => total + (287 * diameter / cuttingData.feedAtThreadDiameter), 0);
    const perAxialTime = cuttingData.radialPasses === 1 ? sum : round(sum, 2);
    // CNC!AR23-AR26 use the normal pass count even when C28 shows micro revolutions.
    const normalPasses = getAxialPasses(input.threadLength, tool.cuttingEdgeLength, getProgramPitch(input), 10);
    let rawTime = perAxialTime * normalPasses;
    if (isMicroTool(input, tool)) {
      if (input.overrides.cuttingEdgeLength !== null) rawTime /= normalPasses;
      rawTime *= (cuttingData.axialPasses + 0.52) * 0.657;
    }
    return rawTime >= 10 ? Math.round(rawTime) : round(rawTime, 1);
  }

  function buildFanucMillingMicroProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const tool = result.tool;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const axialTravel = round((2 * leadZ) + (data.axialPasses * pitch), 3);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const startCompensation = getFanucStartCompensation(input, data.radialPasses);
    const startAbs = round(input.threadLength + input.safetyDistance - startCompensation, 3);
    const firstRetract = isLeftHandThread(input) ? axialTravel : -axialTravel;
    const finalRetract = isLeftHandThread(input) ? startAbs : round(startAbs - axialTravel, 3);
    const startDepth = isLeftHandThread(input) ? round(startAbs - axialTravel, 3) : startAbs;
    const lines = [`S${data.spindleSpeed} M3`, `G00 G91 Z${formatFanucInitialRapidZ(startDepth)}`];

    passDiameters.forEach((diameter, index) => {
      const passNumber = index + 1;
      const k = round((diameter - tool.cutterDiameter) / 4, 3);
      const radius = round(2 * k, 3);
      const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
      const leadFeed = Math.round(passFeed * 0.5);
      const exitFeed = passFeed * 5;

      lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} Y-${formatGCodeNumber(k, 3)} F${leadFeed}`);
      lines.push(`G03 X${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
      if (index === 0) {
        lines.push(`#1=${data.axialPasses}`);
      }
      lines.push("#2=0");
      lines.push(`WHILE[#2LT#1]DO${passNumber}`);
      lines.push(`G03 X0. Y0. Z${formatFanucHelixZ(input, pitch)} I-${formatGCodeNumber(radius, 3)} J0. F${passFeed}`);
      lines.push("#2=#2+1");
      lines.push(`END${passNumber}`);
      lines.push(`G03 X-${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
      lines.push(`G01 G40 X-${formatGCodeNumber(k, 3)} Y-${formatGCodeNumber(k, 3)}`);
      lines.push(`G00 Z${formatGCodeNumber(index < passDiameters.length - 1 ? firstRetract : finalRetract, 3)}`);
    });

    return lines;
  }

  function buildFanucMicroTwoPassProgram(result) {
    return buildFanucMillingMicroProgram(result, 2);
  }

  function appendFanucMillingPass(lines, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;

    lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} Y-${formatGCodeNumber(k, 3)} F${leadFeed}`);
    lines.push(`G03 X${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
    lines.push(`G03 X0. Y0. Z${formatFanucHelixZ(input, pitch)} I-${formatGCodeNumber(radius, 3)} J0. F${passFeed}`);
    lines.push(`G03 X-${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
    lines.push(`G01 G40 X-${formatGCodeNumber(k, 3)} Y-${formatGCodeNumber(k, 3)}`);
  }

  function appendFanucMillingTaperedPass(lines, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const quarterZ = round(pitch / 4, 3);
    const taperStep = getFanucTaperStep(input);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;
    const r1 = radius;
    const r2 = round(radius + (2 * taperStep), 3);
    const r3 = round(radius + (3 * taperStep), 3);
    const r4 = round(radius + (4 * taperStep), 3);
    const rPlusStep = round(radius + taperStep, 3);

    lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} Y-${formatGCodeNumber(k, 3)} F${leadFeed}`);
    lines.push(`G03 X${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
    lines.push(`G03 X-${formatGCodeNumber(r1, 3)} Y${formatGCodeNumber(rPlusStep, 3)} Z${formatFanucHelixZ(input, quarterZ)} I-${formatGCodeNumber(r1, 3)} J${formatGCodeNumber(taperStep, 3)} F${passFeed}`);
    lines.push(`G03 X-${formatGCodeNumber(r2, 3)} Y-${formatGCodeNumber(rPlusStep, 3)} Z${formatFanucHelixZ(input, quarterZ)} I-${formatGCodeNumber(taperStep, 3)} J-${formatGCodeNumber(rPlusStep, 3)}`);
    lines.push(`G03 X${formatGCodeNumber(r2, 3)} Y-${formatGCodeNumber(r3, 3)} Z${formatFanucHelixZ(input, quarterZ)} I${formatGCodeNumber(r2, 3)} J-${formatGCodeNumber(taperStep, 3)}`);
    lines.push(`G03 X${formatGCodeNumber(r4, 3)} Y${formatGCodeNumber(r3, 3)} Z${formatFanucHelixZ(input, quarterZ)} I${formatGCodeNumber(taperStep, 3)} J${formatGCodeNumber(r3, 3)}`);
    lines.push(`G03 X-${formatGCodeNumber(k, 3)} Y${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
    lines.push(`G01 G40 X-${formatGCodeNumber(round(k + (4 * taperStep), 3), 3)} Y-${formatGCodeNumber(k, 3)}`);
  }

  function appendFanucLatheNormalPass(lines, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;

    lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} C-${formatGCodeNumber(k, 3)} F${leadFeed}`);
    lines.push(`G03 X${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
    lines.push(`G03 X0. C0. Z${formatFanucHelixZ(input, pitch)} I-${formatGCodeNumber(radius, 3)} J0. F${passFeed}`);
    lines.push(`G03 X-${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
    lines.push(`G01 G40 X-${formatGCodeNumber(k, 3)} C-${formatGCodeNumber(k, 3)}`);
  }

  function appendFanucLatheTaperedPass(lines, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const quarterZ = round(pitch / 4, 3);
    const taperStep = getFanucTaperStep(input);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;
    const r1 = radius;
    const r2 = round(radius + (2 * taperStep), 3);
    const r3 = round(radius + (3 * taperStep), 3);
    const r4 = round(radius + (4 * taperStep), 3);
    const rPlusStep = round(radius + taperStep, 3);

    lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} C-${formatGCodeNumber(k, 3)} F${leadFeed}`);
    lines.push(`G03 X${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
    lines.push(`G03 X-${formatGCodeNumber(r1, 3)} C${formatGCodeNumber(rPlusStep, 3)} Z${formatFanucHelixZ(input, quarterZ)} I-${formatGCodeNumber(r1, 3)} J${formatGCodeNumber(taperStep, 3)} F${passFeed}`);
    lines.push(`G03 X-${formatGCodeNumber(r2, 3)} C-${formatGCodeNumber(rPlusStep, 3)} Z${formatFanucHelixZ(input, quarterZ)} I-${formatGCodeNumber(taperStep, 3)} J-${formatGCodeNumber(rPlusStep, 3)}`);
    lines.push(`G03 X${formatGCodeNumber(r2, 3)} C-${formatGCodeNumber(r3, 3)} Z${formatFanucHelixZ(input, quarterZ)} I${formatGCodeNumber(r2, 3)} J-${formatGCodeNumber(taperStep, 3)}`);
    lines.push(`G03 X${formatGCodeNumber(r4, 3)} C${formatGCodeNumber(r3, 3)} Z${formatFanucHelixZ(input, quarterZ)} I${formatGCodeNumber(taperStep, 3)} J${formatGCodeNumber(r3, 3)}`);
    lines.push(`G03 X-${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
    lines.push(`G01 G40 X-${formatGCodeNumber(round(k + (4 * taperStep), 3), 3)} C-${formatGCodeNumber(k, 3)}`);
  }

  function buildFanucMillingNormalProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const startZ = getFanucThreadStartDepth(input, data.radialPasses, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const lines = [`S${data.spindleSpeed} M3`, `G00 G91 Z${formatFanucInitialRapidZ(startZ)}`];

    passDiameters.forEach((diameter, index) => {
      appendFanucMillingPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        const retract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        lines.push(`G00 Z${formatGCodeNumber(retract, 3)}`);
      }
    });

    lines.push(`G00 Z${formatGCodeNumber(finalRetract, 3)}`);
    return lines;
  }

  function buildFanucMillingAxialProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const axialMove = getAxialMove(result.tool, input);
    const startZ = getFanucThreadStartDepth(input, passCount, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const cycleCompensation = interPassCompensations.reduce((sum, value) => sum + value, 0);
    // Each loop must advance exactly axialMove, including the flank-infeed offsets.
    const lastAxialRetract = round(axialMove + cycleCompensation
      + (isLeftHandThread(input) ? travelPerPass : -travelPerPass), 3);
    const finalAxialRetract = round(startZ - (data.axialPasses * axialMove), 3);
    const lines = [
      `S${data.spindleSpeed} M3`,
      `G00 G91 Z${formatFanucInitialRapidZ(startZ)}`,
      `#1=${data.axialPasses}`,
      "#2=0",
      "WHILE[#2LT#1]DO1"
    ];

    passDiameters.forEach((diameter, index) => {
      appendFanucMillingPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        const retract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        lines.push(`G00 Z${formatGCodeNumber(retract, 3)}`);
      } else {
        lines.push(`G00 Z${formatGCodeNumber(lastAxialRetract, 3)}`);
      }
    });

    lines.push("#2=#2+1");
    lines.push("END1");
    lines.push(`G00 Z${formatGCodeNumber(finalAxialRetract, 3)}`);
    return lines;
  }

  function buildFanucMillingTaperedProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + (4 * round(pitch / 4, 3));
    const startZ = getFanucThreadStartDepth(input, passCount, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const lines = [`S${data.spindleSpeed} M3`, `G00 G91 Z${formatFanucInitialRapidZ(startZ)}`];

    passDiameters.forEach((diameter, index) => {
      appendFanucMillingTaperedPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        const interPassRetract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        lines.push(`G00 Z${formatGCodeNumber(interPassRetract, 3)}`);
      }
    });

    lines.push(`G00 Z${formatGCodeNumber(finalRetract, 3)}`);
    return lines;
  }

  function buildFanucLatheNormalProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const startZ = getFanucThreadStartDepth(input, data.radialPasses, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    // CNC!CE uses the two-pass compensation for both lathe between-pass rapids.
    const interPassRetract = getFanucInterPassRetract(input, travelPerPass, getFanucStartCompensation(input, 2));
    const lines = [
      `S${data.spindleSpeed} M13`,
      `G00 G91 G94 Z${formatFanucInitialRapidZ(startZ)}`,
      "G12.1"
    ];

    passDiameters.forEach((diameter, index) => {
      appendFanucLatheNormalPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        lines.push(`G00 Z${formatGCodeNumber(interPassRetract, 3)}`);
      }
    });

    lines.push("G13.1");
    lines.push(`G00 Z${formatGCodeNumber(finalRetract, 3)}`);
    return lines;
  }

  function buildFanucLatheAxialProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const axialMove = getAxialMove(result.tool, input);
    const lastAxialRetract = isLeftHandThread(input)
      ? round(axialMove + travelPerPass, 3)
      : round(axialMove - (pitch * 1.25), 3);
    const finalAxialRetract = isLeftHandThread(input)
      ? round(input.threadLength + input.safetyDistance - (data.axialPasses * axialMove) - travelPerPass, 3)
      : round(input.threadLength + input.safetyDistance - (data.axialPasses * axialMove), 3);
    const startZ = getFanucThreadStartDepth(input, data.radialPasses, travelPerPass);
    const interPassRetract = getFanucInterPassRetract(input, travelPerPass, getFanucStartCompensation(input, 2));
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const lines = [
      `S${data.spindleSpeed} M13`,
      `G00 G91 G94 Z${formatFanucInitialRapidZ(startZ)}`,
      "G12.1",
      `#1=${data.axialPasses}`,
      "#2=0",
      "WHILE[#2LT#1]DO1"
    ];

    passDiameters.forEach((diameter, index) => {
      appendFanucLatheNormalPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        lines.push(`G00 Z${formatGCodeNumber(interPassRetract, 3)}`);
      } else {
        lines.push(`G00 Z${formatGCodeNumber(lastAxialRetract, 3)}`);
      }
    });

    lines.push("#2=#2+1");
    lines.push("END1");
    lines.push("G13.1");
    lines.push(`G00 Z${formatGCodeNumber(finalAxialRetract, 3)}`);
    return lines;
  }

  function buildFanucLatheMicroProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const tool = result.tool;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const axialTravel = round((2 * leadZ) + (data.axialPasses * pitch), 3);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const startCompensation = getFanucStartCompensation(input, data.radialPasses);
    const startAbs = round(input.threadLength + input.safetyDistance - startCompensation, 3);
    const firstRetract = isLeftHandThread(input) ? axialTravel : -axialTravel;
    const finalRetract = isLeftHandThread(input) ? startAbs : round(startAbs - axialTravel, 3);
    const startDepth = isLeftHandThread(input) ? round(startAbs - axialTravel, 3) : startAbs;
    const lines = [
      `S${data.spindleSpeed} M13`,
      `G00 G91 G94 Z${formatFanucInitialRapidZ(startDepth)}`,
      "G12.1"
    ];

    passDiameters.forEach((diameter, index) => {
      const passNumber = index + 1;
      const k = round((diameter - tool.cutterDiameter) / 4, 3);
      const radius = round(2 * k, 3);
      const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
      const leadFeed = Math.round(passFeed * 0.5);
      const exitFeed = passFeed * 5;

      lines.push(`G01 G41 X${formatGCodeNumber(k, 3)} C-${formatGCodeNumber(k, 3)} F${leadFeed}`);
      lines.push(`G03 X${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I0. J${formatGCodeNumber(k, 3)}`);
      if (index === 0) {
        lines.push(`#1=${data.axialPasses}`);
      }
      lines.push("#2=0");
      lines.push(`WHILE[#2LT#1]DO${passNumber}`);
      lines.push(`G03 X0. C0. Z${formatFanucHelixZ(input, pitch)} I-${formatGCodeNumber(radius, 3)} J0. F${passFeed}`);
      lines.push("#2=#2+1");
      lines.push(`END${passNumber}`);
      lines.push(`G03 X-${formatGCodeNumber(k, 3)} C${formatGCodeNumber(k, 3)} Z${formatFanucHelixZ(input, leadZ)} I-${formatGCodeNumber(k, 3)} J0. F${exitFeed}`);
      lines.push(`G01 G40 X-${formatGCodeNumber(k, 3)} C-${formatGCodeNumber(k, 3)}`);

      if (index < passDiameters.length - 1) {
        lines.push(`G00 Z${formatGCodeNumber(firstRetract, 3)}`);
      }
    });

    lines.push("G13.1");
    lines.push(`G00 Z${formatGCodeNumber(finalRetract, 3)}`);
    return lines;
  }

  function buildFanucLatheTaperedProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const startZ = getFanucThreadStartDepth(input, data.radialPasses, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const interPassRetract = getFanucInterPassRetract(input, travelPerPass, getFanucStartCompensation(input, 2));
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const lines = [
      `S${data.spindleSpeed} M13`,
      `G00 G91 G94 Z${formatFanucInitialRapidZ(startZ)}`,
      "G12.1"
    ];

    passDiameters.forEach((diameter, index) => {
      appendFanucLatheTaperedPass(lines, input, result.tool, data, diameter);

      if (index < passDiameters.length - 1) {
        lines.push(`G00 Z${formatGCodeNumber(interPassRetract, 3)}`);
      }
    });

    lines.push("G13.1");
    lines.push(`G00 Z${formatGCodeNumber(finalRetract, 3)}`);
    return lines;
  }

  function buildFanucProgram(result) {
    if (!result.tool || result.errors.length) {
      return ["The program doesn't accept your choice.", "Please, test with other values."];
    }

    const data = result.cuttingData;
    const input = result.input;
    const normalMillingMatch = String(input.programVariant || "").match(/^milling-normal-([123])-pass$/);
    const axialMillingMatch = String(input.programVariant || "").match(/^milling-axial-([123])-pass$/);
    const microMillingMatch = String(input.programVariant || "").match(/^milling-micro-([123])-pass$/);
    const taperedMillingMatch = String(input.programVariant || "").match(/^milling-tapered-([123])-pass$/);
    const normalLatheMatch = String(input.programVariant || "").match(/^lathe-normal-([123])-pass$/);
    const axialLatheMatch = String(input.programVariant || "").match(/^lathe-axial-([123])-pass$/);
    const microLatheMatch = String(input.programVariant || "").match(/^lathe-micro-([123])-pass$/);
    const taperedLatheMatch = String(input.programVariant || "").match(/^lathe-tapered-([123])-pass$/);

    if (normalMillingMatch) {
      return buildFanucMillingNormalProgram(result, Number(normalMillingMatch[1]));
    }

    if (axialMillingMatch) {
      return buildFanucMillingAxialProgram(result, Number(axialMillingMatch[1]));
    }

    if (microMillingMatch) {
      return buildFanucMillingMicroProgram(result, Number(microMillingMatch[1]));
    }

    if (taperedMillingMatch) {
      return buildFanucMillingTaperedProgram(result, Number(taperedMillingMatch[1]));
    }

    if (normalLatheMatch) {
      return buildFanucLatheNormalProgram(result, Number(normalLatheMatch[1]));
    }

    if (axialLatheMatch) {
      return buildFanucLatheAxialProgram(result, Number(axialLatheMatch[1]));
    }

    if (microLatheMatch) {
      return buildFanucLatheMicroProgram(result, Number(microLatheMatch[1]));
    }

    if (taperedLatheMatch) {
      return buildFanucLatheTaperedProgram(result, Number(taperedLatheMatch[1]));
    }

    if (isMicroTool(input, result.tool)) {
      return input.processId === "lathe-live-tool"
        ? buildFanucLatheMicroProgram(result, data.radialPasses)
        : buildFanucMillingMicroProgram(result, data.radialPasses);
    }

    if (input.processId === "lathe-live-tool") {
      if (result.tool.typeCode === 4) {
        return buildFanucLatheTaperedProgram(result, data.radialPasses);
      }

      return data.axialPasses > 1
        ? buildFanucLatheAxialProgram(result, data.radialPasses)
        : buildFanucLatheNormalProgram(result, data.radialPasses);
    }

    if (result.tool.typeCode === 4) {
      return buildFanucMillingTaperedProgram(result, data.radialPasses);
    }

    return data.axialPasses > 1
      ? buildFanucMillingAxialProgram(result, data.radialPasses)
      : buildFanucMillingNormalProgram(result, data.radialPasses);
  }

  function createHeidenhainLineBuilder() {
    let lineNumber = 1;
    const lines = [];
    return {
      add(command) {
        lines.push(`${lineNumber} ${command}`);
        lineNumber += 1;
      },
      lines
    };
  }

  function formatHeidenhainHelixZ(input, value) {
    // Same downward, counterclockwise left-hand strategy as the Fanuc post.
    return formatHeidenhainAxis("IZ", value * (isLeftHandThread(input) ? -1 : 1));
  }

  function appendHeidenhainMillingPass(builder, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;

    builder.add(`L ${formatHeidenhainAxis("IX", k)} ${formatHeidenhainAxis("IY", -k)} RL F${leadFeed}`);
    builder.add(`CC ${formatHeidenhainAxis("IX", 0)} ${formatHeidenhainAxis("IY", k)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+`);
    builder.add(`CC ${formatHeidenhainAxis("IX", -radius)} ${formatHeidenhainAxis("IY", 0)}`);
    builder.add(`CP IPA+360 ${formatHeidenhainHelixZ(input, pitch)} DR+ F${passFeed}`);
    builder.add(`CC ${formatHeidenhainAxis("IX", -k)} ${formatHeidenhainAxis("IY", 0)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+ F${exitFeed}`);
    builder.add(`L ${formatHeidenhainAxis("IX", -k)} ${formatHeidenhainAxis("IY", -k)} R0`);
  }

  function appendHeidenhainMillingTaperedPass(builder, input, tool, data, diameter) {
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const quarterZ = round(pitch / 4, 3);
    const taperStep = getFanucTaperStep(input);
    const k = round((diameter - tool.cutterDiameter) / 4, 3);
    const radius = round(2 * k, 3);
    const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
    const leadFeed = Math.round(passFeed * 0.5);
    const exitFeed = passFeed * 5;
    const r1 = radius;
    const r2 = round(radius + (2 * taperStep), 3);
    const r3 = round(radius + (3 * taperStep), 3);
    const rPlusStep = round(radius + taperStep, 3);

    builder.add(`L ${formatHeidenhainAxis("IX", k)} ${formatHeidenhainAxis("IY", -k)} RL F${leadFeed}`);
    builder.add(`CC ${formatHeidenhainAxis("IX", 0)} ${formatHeidenhainAxis("IY", k)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+`);
    builder.add(`CC ${formatHeidenhainAxis("IX", -r1)} ${formatHeidenhainAxis("IY", taperStep)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, quarterZ)} DR+ F${passFeed}`);
    builder.add(`CC ${formatHeidenhainAxis("IX", -taperStep)} ${formatHeidenhainAxis("IY", -rPlusStep)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, quarterZ)} DR+`);
    builder.add(`CC ${formatHeidenhainAxis("IX", r2)} ${formatHeidenhainAxis("IY", -taperStep)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, quarterZ)} DR+`);
    builder.add(`CC ${formatHeidenhainAxis("IX", taperStep)} ${formatHeidenhainAxis("IY", r3)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, quarterZ)} DR+`);
    builder.add(`CC ${formatHeidenhainAxis("IX", -k)} ${formatHeidenhainAxis("IY", 0)}`);
    builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+ F${exitFeed}`);
    builder.add(`L ${formatHeidenhainAxis("IX", -round(k + (4 * taperStep), 3))} ${formatHeidenhainAxis("IY", -k)} R0`);
  }

  function beginHeidenhainMillingProgram(result, startZ) {
    const builder = createHeidenhainLineBuilder();
    builder.add(`TOOL CALL 1 Z S${result.cuttingData.spindleSpeed}`);
    builder.add("L M3");
    builder.add(`L ${formatHeidenhainAxis("IZ", -startZ)} FMAX`);
    return builder;
  }

  function buildHeidenhainMillingNormalProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const startZ = getFanucThreadStartDepth(input, data.radialPasses, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const builder = beginHeidenhainMillingProgram(result, startZ);

    passDiameters.forEach((diameter, index) => {
      appendHeidenhainMillingPass(builder, input, result.tool, data, diameter);
      if (index < passDiameters.length - 1) {
        const retract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        builder.add(`L ${formatHeidenhainAxis("IZ", retract)} FMAX`);
      }
    });

    builder.add(`L ${formatHeidenhainAxis("IZ", finalRetract)} FMAX`);
    return builder.lines;
  }

  function buildHeidenhainMillingAxialProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + pitch;
    const axialMove = getAxialMove(result.tool, input);
    const startZ = getFanucThreadStartDepth(input, passCount, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const cycleCompensation = interPassCompensations.reduce((sum, value) => sum + value, 0);
    // Each loop must advance exactly axialMove, including the flank-infeed offsets.
    const lastAxialRetract = round(axialMove + cycleCompensation
      + (isLeftHandThread(input) ? travelPerPass : -travelPerPass), 3);
    const finalAxialRetract = round(startZ - (data.axialPasses * axialMove), 3);
    const builder = beginHeidenhainMillingProgram(result, startZ);

    builder.add(`FN 0: Q1 =${formatHeidenhainForcedPlus(data.axialPasses, 0)}`);
    builder.add("FN 0: Q2 =+0");
    builder.add("LBL 101");

    passDiameters.forEach((diameter, index) => {
      appendHeidenhainMillingPass(builder, input, result.tool, data, diameter);
      if (index < passDiameters.length - 1) {
        const retract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        builder.add(`L ${formatHeidenhainAxis("IZ", retract)} FMAX`);
      }
    });

    builder.add(`L ${formatHeidenhainAxis("IZ", lastAxialRetract)} FMAX`);
    builder.add("FN 1: Q2 =+Q2 + +1");
    builder.add("FN 12: IF +Q2 LT +Q1 GOTO LBL 101");
    builder.add(`L ${formatHeidenhainAxis("IZ", finalAxialRetract)} FMAX`);
    return builder.lines;
  }

  function buildHeidenhainMillingMicroProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const tool = result.tool;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const axialTravel = round((2 * leadZ) + (data.axialPasses * pitch), 3);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const startCompensation = getFanucStartCompensation(input, data.radialPasses);
    const startAbs = round(input.threadLength + input.safetyDistance - startCompensation, 3);
    const firstRetract = isLeftHandThread(input) ? axialTravel : -axialTravel;
    const finalRetract = isLeftHandThread(input) ? startAbs : round(startAbs - axialTravel, 3);
    const startDepth = isLeftHandThread(input) ? round(startAbs - axialTravel, 3) : startAbs;
    const builder = beginHeidenhainMillingProgram(result, startDepth);

    passDiameters.forEach((diameter, index) => {
      const passNumber = index + 1;
      const k = round((diameter - tool.cutterDiameter) / 4, 3);
      const radius = round(2 * k, 3);
      const passFeed = Math.round(data.feedAtThreadDiameter * (diameter - tool.cutterDiameter) / diameter);
      const leadFeed = Math.round(passFeed * 0.5);
      const exitFeed = passFeed * 5;

      builder.add(`L ${formatHeidenhainAxis("IX", k)} ${formatHeidenhainAxis("IY", -k)} RL F${leadFeed}`);
      builder.add(`CC ${formatHeidenhainAxis("IX", 0)} ${formatHeidenhainAxis("IY", k)}`);
      builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+`);
      if (index === 0) {
        builder.add(`FN 0: Q1 =${formatHeidenhainForcedPlus(data.axialPasses, 0)}`);
      }
      builder.add("FN 0: Q2 =+0");
      builder.add(`LBL 10${passNumber}`);
      builder.add(`CC ${formatHeidenhainAxis("IX", -radius)} ${formatHeidenhainAxis("IY", 0)}`);
      builder.add(`CP IPA+360 ${formatHeidenhainHelixZ(input, pitch)} DR+ F${passFeed}`);
      builder.add("FN 1: Q2 =+Q2 + +1");
      builder.add(`FN 12: IF +Q2 LT +Q1 GOTO LBL 10${passNumber}`);
      builder.add(`CC ${formatHeidenhainAxis("IX", -k)} ${formatHeidenhainAxis("IY", 0)}`);
      builder.add(`CP IPA+90 ${formatHeidenhainHelixZ(input, leadZ)} DR+ F${exitFeed}`);
      builder.add(`L ${formatHeidenhainAxis("IX", -k)} ${formatHeidenhainAxis("IY", -k)} R0`);
      builder.add(`L ${formatHeidenhainAxis("IZ", index < passDiameters.length - 1 ? firstRetract : finalRetract)} FMAX`);
    });

    return builder.lines;
  }

  function buildHeidenhainMillingTaperedProgram(result, passCount) {
    const data = result.cuttingData;
    const input = result.input;
    const pitch = getProgramPitch(input);
    const leadZ = round(pitch / 8, 3);
    const travelPerPass = (2 * leadZ) + (4 * round(pitch / 4, 3));
    const startZ = getFanucThreadStartDepth(input, passCount, travelPerPass);
    const finalRetract = getFanucFinalRetract(input, travelPerPass);
    const passDiameters = getFanucRadialPassDiameters(input, passCount);
    const interPassCompensations = getFanucInterPassCompensations(passDiameters, input);
    const builder = beginHeidenhainMillingProgram(result, startZ);

    passDiameters.forEach((diameter, index) => {
      appendHeidenhainMillingTaperedPass(builder, input, result.tool, data, diameter);
      if (index < passDiameters.length - 1) {
        const interPassRetract = getFanucInterPassRetract(input, travelPerPass, interPassCompensations[index]);
        builder.add(`L ${formatHeidenhainAxis("IZ", interPassRetract)} FMAX`);
      }
    });

    builder.add(`L ${formatHeidenhainAxis("IZ", finalRetract)} FMAX`);
    return builder.lines;
  }

  function buildHeidenhainProgram(result) {
    if (!result.tool || result.errors.length) {
      return ["The program doesn't accept your choice.", "Please, test with other values."];
    }

    if (result.input.processId !== "machining-center") {
      return ["Heidenhain Klartext is currently implemented for machining-center milling only."];
    }

    const data = result.cuttingData;
    const input = result.input;
    const normalMillingMatch = String(input.programVariant || "").match(/^milling-normal-([123])-pass$/);
    const axialMillingMatch = String(input.programVariant || "").match(/^milling-axial-([123])-pass$/);
    const microMillingMatch = String(input.programVariant || "").match(/^milling-micro-([123])-pass$/);
    const taperedMillingMatch = String(input.programVariant || "").match(/^milling-tapered-([123])-pass$/);

    if (normalMillingMatch) {
      return buildHeidenhainMillingNormalProgram(result, Number(normalMillingMatch[1]));
    }

    if (axialMillingMatch) {
      return buildHeidenhainMillingAxialProgram(result, Number(axialMillingMatch[1]));
    }

    if (microMillingMatch) {
      return buildHeidenhainMillingMicroProgram(result, Number(microMillingMatch[1]));
    }

    if (taperedMillingMatch) {
      return buildHeidenhainMillingTaperedProgram(result, Number(taperedMillingMatch[1]));
    }

    if (isMicroTool(input, result.tool)) {
      return buildHeidenhainMillingMicroProgram(result, data.radialPasses);
    }

    if (result.tool.typeCode === 4) {
      return buildHeidenhainMillingTaperedProgram(result, data.radialPasses);
    }

    return data.axialPasses > 1
      ? buildHeidenhainMillingAxialProgram(result, data.radialPasses)
      : buildHeidenhainMillingNormalProgram(result, data.radialPasses);
  }

  const PROGRAM_POSTS = {
    "fanuc-iso-ijk": {
      id: "fanuc-iso-ijk",
      label: "Fanuc / ISO IJK",
      syntaxFamily: "iso",
      arcMode: "ijk",
      macroMode: "macro-when-required",
      buildProgram: buildFanucProgram
    },
    "heidenhain-klartext-vertical": {
      id: "heidenhain-klartext-vertical",
      label: "Heidenhain Klartext (vertical milling)",
      syntaxFamily: "klartext",
      arcMode: "heidenhain-cp",
      macroMode: "q-parameters-when-required",
      buildProgram: buildHeidenhainProgram
    }
  };

  function analyzeCncProgram(lines) {
    const programLines = Array.isArray(lines) ? lines : [];
    const arcLines = programLines.filter((line) => /^G0[23]\s/.test(String(line)));
    return {
      usesMacroVariables: programLines.some((line) => /^#\d+=/.test(String(line))),
      usesWhileLoops: programLines.some((line) => /^WHILE\[/.test(String(line)) || /^END\d+/.test(String(line))),
      usesPolarInterpolation: programLines.some((line) => /^G1[23]\.1$/.test(String(line))),
      usesIjkArcs: arcLines.some((line) => /\sI-?\d/.test(String(line)) || /\sJ-?\d/.test(String(line)) || /\sK-?\d/.test(String(line))),
      usesRadiusArcs: arcLines.some((line) => /\sR-?\d/.test(String(line))),
      arcLinesWithoutIjk: arcLines.filter((line) => !(/\sI-?\d/.test(String(line)) || /\sJ-?\d/.test(String(line)) || /\sK-?\d/.test(String(line)))).length,
      arcLineCount: arcLines.length
    };
  }

  function getProgramPost(controlSystem, options) {
    const allowInternalPosts = Boolean(options && options.includeInternalPosts);
    if (!controlSystem || (!allowInternalPosts && !canUseControlSystemPost(controlSystem))) return null;
    return PROGRAM_POSTS[controlSystem.postId] || null;
  }

  function buildUnsupportedControlProgram(controlSystem) {
    const label = controlSystem && controlSystem.label ? controlSystem.label : "The selected control system";
    return [
      `${label} is not released for CNC program generation.`,
      "Choose a released control system or contact SmiCut."
    ];
  }

  function buildCncProgram(result, data, options) {
    const controlSystem = findControlSystem(data, result.input.controlSystemId);
    const post = getProgramPost(controlSystem, options);
    if (!post) {
      const cncProgram = buildUnsupportedControlProgram(controlSystem);
      return {
        controlSystem,
        postProcessor: null,
        canGenerateCncProgram: false,
        cncProgram,
        programAnalysis: analyzeCncProgram(cncProgram)
      };
    }

    const templatePattern = controlSystem.id === "heidenhain"
      ? /^milling-(?:normal|axial|micro|tapered)-([123])-pass$/
      : /^(?:milling|lathe)-(?:normal|axial|micro|tapered)-([123])-pass$/;
    const templatePasses = String(result.input.programVariant || "").match(templatePattern);
    const passCount = templatePasses ? Number(templatePasses[1]) : result.cuttingData.radialPasses;
    for (const diameter of getFanucRadialPassDiameters(result.input, passCount)) {
      const leadRadius = round((diameter - result.tool.cutterDiameter) / 4, 3);
      const feed = Math.round(result.cuttingData.feedAtThreadDiameter
        * (diameter - result.tool.cutterDiameter) / diameter);
      if (!(leadRadius > 0) || !(feed > 0) || !(Math.round(feed * 0.5) > 0)) {
        result.errors.push("A radial pass is too small for this cutter or produces zero feed. Use fewer radial passes, a smaller cutter, or suitable cutting data.");
        return { controlSystem, postProcessor: post, canGenerateCncProgram: false,
          cncProgram: ["The program doesn't accept your choice.", "Please, test with other values."],
          programAnalysis: analyzeCncProgram([]) };
      }
    }
    if (!(result.cuttingData.spindleSpeed > 0)) {
      result.errors.push("The selected cutting data produces zero spindle speed. Increase the cutting speed.");
      return { controlSystem, postProcessor: post, canGenerateCncProgram: false,
        cncProgram: ["The program doesn't accept your choice.", "Please, test with other values."],
        programAnalysis: analyzeCncProgram([]) };
    }

    const cncProgram = post.buildProgram(result);
    const supportedOperation = controlSystem.machineTypes.includes(result.input.processId);
    return {
      controlSystem,
      postProcessor: post,
      canGenerateCncProgram: supportedOperation,
      cncProgram,
      programAnalysis: analyzeCncProgram(cncProgram)
    };
  }

  function calculate(input, data, options) {
    const normalizedInput = {
      processId: input.processId,
      controlSystemId: input.controlSystemId,
      threadProfileId: input.threadProfileId,
      materialId: input.materialId,
      diameter: toNumber(input.diameter, 0),
      pitch: toNumber(input.pitch, 0),
      threadLength: toNumber(input.threadLength, 0),
      safetyDistance: toNumber(input.safetyDistance, 0),
      selectedToolId: input.selectedToolId || "",
      programVariant: input.programVariant || "",
      threadHand: input.threadHand === "left" ? "left" : "right",
      machineCost: input.machineCost === undefined ? 80 : Number(input.machineCost),
      toolLife: input.toolLife === undefined ? 120 : Number(input.toolLife),
      overrides: {
        cutterDiameter: optionalNumber(input.overrides && input.overrides.cutterDiameter),
        cuttingEdgeLength: optionalNumber(input.overrides && input.overrides.cuttingEdgeLength),
        flutes: optionalNumber(input.overrides && input.overrides.flutes),
        toolPrice: optionalNumber(input.overrides && input.overrides.toolPrice),
        cuttingSpeed: optionalNumber(input.overrides && input.overrides.cuttingSpeed),
        feedPerTooth: optionalNumber(input.overrides && input.overrides.feedPerTooth),
        radialPasses: optionalRadialPasses(input.overrides && input.overrides.radialPasses)
      }
    };

    const material = findMaterial(data, normalizedInput.materialId);
    const threadProfile = findThreadProfile(data, normalizedInput.threadProfileId);
    const controlSystem = findControlSystem(data, normalizedInput.controlSystemId);
    normalizedInput.programPitch = Number(threadProfile.excelId) === 1
      ? normalizedInput.pitch
      : round(25.4 / normalizedInput.pitch, 3);
    const candidates = filterTools(data, normalizedInput);
    const tool = getEffectiveTool(candidates, normalizedInput.selectedToolId, normalizedInput.overrides);
    const errors = [];
    const catalogueTool = getSelectedTool(candidates, normalizedInput.selectedToolId);
    if (catalogueTool && !hasCustomTool(normalizedInput.overrides) &&
        normalizedInput.overrides.cutterDiameter > catalogueTool.cutterDiameter) {
      const maximum = String(catalogueTool.cutterDiameter).replace(".", ",");
      errors.push(`The laser-marked diameter cannot exceed the catalogue cutter diameter (${maximum} mm). Enter the marked value or reset to the catalogue diameter.`);
    }

    if (
      !isPositiveFiniteNumber(normalizedInput.diameter) ||
      !isPositiveFiniteNumber(normalizedInput.pitch) ||
      !isPositiveFiniteNumber(normalizedInput.threadLength)
    ) {
      errors.push("Enter thread diameter, pitch and thread length.");
    }

    if (!isNonNegativeFiniteNumber(normalizedInput.safetyDistance)) {
      errors.push("Enter a valid safety distance.");
    }

    if (!isNonNegativeFiniteNumber(normalizedInput.machineCost)) {
      errors.push("Enter a valid machine cost.");
    }

    if (!isPositiveFiniteNumber(normalizedInput.toolLife)) {
      errors.push("Enter a valid tool life.");
    }

    if (
      normalizedInput.overrides.cutterDiameter !== null &&
      !isPositiveFiniteNumber(normalizedInput.overrides.cutterDiameter)
    ) {
      errors.push("Enter a valid cutter diameter.");
    }

    if (
      normalizedInput.overrides.cuttingEdgeLength !== null &&
      !isPositiveFiniteNumber(normalizedInput.overrides.cuttingEdgeLength)
    ) {
      errors.push("Enter a valid cutting length.");
    }

    if (
      normalizedInput.overrides.flutes !== null &&
      !isPositiveFiniteNumber(normalizedInput.overrides.flutes)
    ) {
      errors.push("Enter a valid number of flutes.");
    }

    if (
      normalizedInput.overrides.toolPrice !== null &&
      !isNonNegativeFiniteNumber(normalizedInput.overrides.toolPrice)
    ) {
      errors.push("Enter a valid tool price.");
    }

    if (
      normalizedInput.overrides.cuttingSpeed !== null &&
      !isPositiveFiniteNumber(normalizedInput.overrides.cuttingSpeed)
    ) {
      errors.push("Enter a valid cutting speed.");
    }

    if (
      normalizedInput.overrides.feedPerTooth !== null &&
      !isPositiveFiniteNumber(normalizedInput.overrides.feedPerTooth)
    ) {
      errors.push("Enter a valid feed per tooth.");
    }

    if (!tool) {
      errors.push("No matching tool was found for the selected input.");
    }

    let cuttingData = null;
    let costData = null;
    let cncProgram = [];
    let selectedControlSystem = controlSystem;
    let postProcessor = getProgramPost(controlSystem, options);
    let canGenerateCncProgram = false;
    let programAnalysis = analyzeCncProgram(cncProgram);

    if (tool && !errors.length) {
      const pathRadius = (normalizedInput.diameter - tool.cutterDiameter) / 2;
      if (pathRadius <= 0) {
        errors.push("The cutter diameter must be smaller than the thread diameter.");
      } else {
        const calculatedRadialPasses = getRadialPasses(material, tool, normalizedInput, threadProfile);
        const radialPasses = normalizedInput.overrides.radialPasses || calculatedRadialPasses;
        const microTool = isMicroTool(normalizedInput, tool);
        const axialPasses = microTool ? getMicroAxialPasses(normalizedInput) : getAxialPasses(
          normalizedInput.threadLength,
          tool.cuttingEdgeLength,
          normalizedInput.programPitch,
          10
        );
        const calculatedFeedPerTooth = getFeedPerTooth(material, tool, radialPasses, threadProfile, normalizedInput);
        const feedPerTooth = normalizedInput.overrides.feedPerTooth || calculatedFeedPerTooth;
        const cuttingSpeed = normalizedInput.overrides.cuttingSpeed || material.cuttingSpeed;
        const spindleSpeed = Math.round(cuttingSpeed * 1000 / (Math.PI * tool.cutterDiameter));
        const feedAtThreadDiameter = Math.round(feedPerTooth * tool.flutes * spindleSpeed);
        const centerFeed = Math.round(feedAtThreadDiameter * (normalizedInput.diameter - tool.cutterDiameter) / normalizedInput.diameter);

        cuttingData = {
          cutterDiameter: tool.cutterDiameter,
          cuttingEdgeLength: tool.cuttingEdgeLength,
          flutes: tool.flutes,
          recommendedCuttingSpeed: material.cuttingSpeed,
          cuttingSpeed,
          calculatedFeedPerTooth,
          feedPerTooth,
          calculatedRadialPasses,
          radialPasses,
          axialPasses,
          spindleSpeed,
          feedAtThreadDiameter,
          centerFeed,
          machiningTime: null,
          pathRadius
        };
        cuttingData.machiningTime = getMachiningTime(normalizedInput, tool, cuttingData);

        const toolPrice = normalizedInput.overrides.toolPrice !== null ? normalizedInput.overrides.toolPrice : tool.priceEur;
        const toolingCostPerThread = toolPrice / (normalizedInput.toolLife * 60 / cuttingData.machiningTime);
        const machineCostPerThread = normalizedInput.machineCost * cuttingData.machiningTime / 3600;
        costData = {
          toolPrice,
          toolLife: normalizedInput.toolLife,
          machineCost: normalizedInput.machineCost,
          toolingCostPerThread,
          machineCostPerThread,
          totalCostPerThread: toolingCostPerThread + machineCostPerThread
        };

        const resultForProgram = {
          input: normalizedInput,
          tool,
          material,
          threadProfile,
          candidates,
          cuttingData,
          costData,
          errors
        };
        const generatedProgram = buildCncProgram(resultForProgram, data, options);
        selectedControlSystem = generatedProgram.controlSystem;
        postProcessor = generatedProgram.postProcessor;
        canGenerateCncProgram = generatedProgram.canGenerateCncProgram;
        cncProgram = generatedProgram.cncProgram;
        programAnalysis = generatedProgram.programAnalysis;
      }
    }

    if (!cncProgram.length) {
      cncProgram = ["The program doesn't accept your choice.", "Please, test with other values."];
      programAnalysis = analyzeCncProgram(cncProgram);
    }

    return {
      input: normalizedInput,
      tool,
      material,
      threadProfile,
      controlSystem: selectedControlSystem,
      candidates,
      cuttingData,
      costData,
      postProcessor,
      canGenerateCncProgram,
      programAnalysis,
      cncProgram,
      errors
    };
  }

  global.SmiProgCore = {
    COMPARE_PASSWORD,
    calculate,
    filterTools,
    findControlSystem,
    getReleasedControlSystems,
    getVisibleControlSystems,
    fmt
  };
})(window);
