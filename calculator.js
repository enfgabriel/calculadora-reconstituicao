const finite = (...values) => values.every(Number.isFinite);
const positive = (...values) => values.every(value => value > 0);
const onIncrement = (value, increment) => Math.abs(value / increment - Math.round(value / increment)) < 1e-9;

export function calculateReconstitution({ vialMg, finalVolumeMl, doseMg, scalePerMl, syringeCapacity, syringeIncrement }) {
  if (!finite(vialMg, finalVolumeMl, doseMg, scalePerMl, syringeCapacity, syringeIncrement)) return { ok: false, code: 'invalid_number' };
  if (!positive(vialMg, finalVolumeMl, scalePerMl, syringeCapacity, syringeIncrement) || doseMg < 0) return { ok: false, code: 'invalid_range' };

  const concentrationMgMl = vialMg / finalVolumeMl;
  const volumeMl = doseMg / concentrationMgMl;
  const scaleValue = volumeMl * scalePerMl;
  const capacityPercent = scaleValue / syringeCapacity * 100;
  const warnings = [];
  if (doseMg > vialMg) warnings.push('dose_exceeds_vial');
  if (scaleValue > syringeCapacity + 1e-9) warnings.push('exceeds_syringe');
  if (volumeMl > 0 && volumeMl < 0.01) warnings.push('very_small_volume');
  if (doseMg > 0 && !onIncrement(scaleValue, syringeIncrement)) warnings.push('not_measurable');
  return { ok: true, concentrationMgMl, volumeMl, scaleValue, capacityPercent, warnings };
}

// Compatibilidade com a versão anterior.
export function calculateDose({ vialMg, finalVolumeMl, doseMg, syringeCapacityUnits, syringeIncrementUnits }) {
  const result = calculateReconstitution({ vialMg, finalVolumeMl, doseMg, scalePerMl: 100, syringeCapacity: syringeCapacityUnits, syringeIncrement: syringeIncrementUnits });
  return result.ok ? { ...result, syringeUnits: result.scaleValue, measurable: !result.warnings.includes('not_measurable') } : result;
}

export function calculateDrip({ volumeMl, hours, minutes = 0, dropFactor }) {
  if (!finite(volumeMl, hours, minutes, dropFactor)) return { ok: false, code: 'invalid_number' };
  const totalMinutes = hours * 60 + minutes;
  if (!positive(volumeMl, totalMinutes, dropFactor) || hours < 0 || minutes < 0) return { ok: false, code: 'invalid_range' };
  const dropsPerMinuteExact = volumeMl * dropFactor / totalMinutes;
  return {
    ok: true,
    totalMinutes,
    dropsPerMinuteExact,
    dropsPerMinute: Math.round(dropsPerMinuteExact),
    mlPerHour: volumeMl / (totalMinutes / 60)
  };
}

export function calculatePump({ volumeMl, rateMlHour }) {
  if (!finite(volumeMl, rateMlHour)) return { ok: false, code: 'invalid_number' };
  if (!positive(volumeMl, rateMlHour)) return { ok: false, code: 'invalid_range' };
  const durationHours = volumeMl / rateMlHour;
  const totalMinutes = durationHours * 60;
  return { ok: true, durationHours, totalMinutes, wholeHours: Math.floor(totalMinutes / 60), remainingMinutes: Math.round(totalMinutes % 60) };
}

export function calculateWeightDose({ prescribedMgKg, weightKg, availableMg, availableVolumeMl, maxDoseMg = null }) {
  if (!finite(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_number' };
  if (!positive(prescribedMgKg, weightKg, availableMg, availableVolumeMl)) return { ok: false, code: 'invalid_range' };
  const doseMg = prescribedMgKg * weightKg;
  const concentrationMgMl = availableMg / availableVolumeMl;
  const volumeMl = doseMg / concentrationMgMl;
  const warnings = [];
  if (maxDoseMg !== null && Number.isFinite(maxDoseMg) && maxDoseMg > 0 && doseMg > maxDoseMg) warnings.push('exceeds_max_dose');
  return { ok: true, doseMg, concentrationMgMl, volumeMl, warnings };
}

export function calculateOxygenDuration({ pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin }) {
  if (!finite(pressureBar, reserveBar, cylinderWaterVolumeL, flowLMin)) return { ok: false, code: 'invalid_number' };
  if (!positive(pressureBar, cylinderWaterVolumeL, flowLMin) || reserveBar < 0 || reserveBar >= pressureBar) return { ok: false, code: 'invalid_range' };
  const usablePressureBar = pressureBar - reserveBar;
  const usableOxygenL = usablePressureBar * cylinderWaterVolumeL;
  const totalMinutes = usableOxygenL / flowLMin;
  const warnings = [];
  if (totalMinutes < 30) warnings.push('critical_duration');
  else if (totalMinutes < 60) warnings.push('short_duration');
  return { ok: true, usablePressureBar, usableOxygenL, totalMinutes, wholeHours: Math.floor(totalMinutes / 60), remainingMinutes: Math.floor(totalMinutes % 60), warnings };
}

export function calculateCompoundLiquid({
  mode,
  amount,
  dropsPerMl = null,
  targetComponentIndex = 0,
  preparation = 'direct',
  sourceVolumeMl = null,
  finalVolumeMl = null,
  components = []
}) {
  const diluted = preparation === 'diluted';
  const sourceVolume = Number(sourceVolumeMl);
  const finalVolume = Number(finalVolumeMl);
  if (diluted && (!finite(sourceVolume, finalVolume) || sourceVolume <= 0 || finalVolume <= 0 || finalVolume < sourceVolume)) {
    return { ok: false, code: 'invalid_dilution' };
  }
  const dilutionFactor = diluted ? sourceVolume / finalVolume : 1;
  const activeComponents = components
    .map((component, index) => {
      const originalConcentrationPerMl = Number(component.concentrationPerMl ?? component.concentrationMgMl);
      const concentrationPerMl = originalConcentrationPerMl * dilutionFactor;
      return {
        ...component,
        index,
        unit: component.unit || 'mg',
        originalConcentrationPerMl,
        concentrationPerMl,
        concentrationMgMl: concentrationPerMl
      };
    })
    .filter(component => component.name && Number.isFinite(component.concentrationPerMl) && component.concentrationPerMl > 0);
  if (!finite(amount) || amount <= 0 || activeComponents.length === 0) return { ok: false, code: 'invalid_range' };
  if ((mode === 'drops' || mode === 'target') && (!Number.isFinite(dropsPerMl) || dropsPerMl <= 0)) return { ok: false, code: 'invalid_range' };

  let volumeMl = amount;
  if (mode === 'drops') volumeMl = amount / dropsPerMl;
  if (mode === 'target') {
    const target = activeComponents.find(component => component.index === targetComponentIndex) || activeComponents[0];
    volumeMl = amount / target.concentrationPerMl;
  }
  if (!Number.isFinite(volumeMl) || volumeMl <= 0) return { ok: false, code: 'invalid_range' };

  const drops = Number.isFinite(dropsPerMl) && dropsPerMl > 0 ? volumeMl * dropsPerMl : null;
  const delivered = activeComponents.map(component => ({
    name: component.name,
    unit: component.unit,
    originalConcentrationPerMl: component.originalConcentrationPerMl,
    concentrationPerMl: component.concentrationPerMl,
    concentrationMgMl: component.concentrationPerMl,
    dose: component.concentrationPerMl * volumeMl,
    doseMg: component.concentrationPerMl * volumeMl
  }));
  return {
    ok: true,
    mode,
    preparation: diluted ? 'diluted' : 'direct',
    dilutionFactor,
    sourceVolumeMl: diluted ? sourceVolume : null,
    finalVolumeMl: diluted ? finalVolume : null,
    volumeMl,
    drops,
    delivered
  };
}

export function formatPt(value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits }).format(value);
}
