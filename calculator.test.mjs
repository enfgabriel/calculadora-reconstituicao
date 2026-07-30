import assert from 'node:assert/strict';
import { calculateReconstitution, calculateDose, calculateDrip, calculatePump, calculateWeightDose, calculateWeightInfusion, calculateOxygenDuration, calculateCompoundLiquid } from './calculator.js';

const u100 = calculateReconstitution({ vialMg: 5, finalVolumeMl: 0.5, doseMg: 0.25, scalePerMl: 100, syringeCapacity: 100, syringeIncrement: 0.5 });
assert.equal(u100.concentrationMgMl, 10); assert.equal(u100.volumeMl, 0.025); assert.equal(u100.scaleValue, 2.5); assert.deepEqual(u100.warnings, []);

const u40 = calculateReconstitution({ vialMg: 10, finalVolumeMl: 2, doseMg: 1, scalePerMl: 40, syringeCapacity: 40, syringeIncrement: 1 });
assert.equal(u40.volumeMl, 0.2); assert.equal(u40.scaleValue, 8);

const mlSyringe = calculateReconstitution({ vialMg: 10, finalVolumeMl: 2, doseMg: 1, scalePerMl: 1, syringeCapacity: 3, syringeIncrement: 0.1 });
assert.equal(mlSyringe.scaleValue, 0.2); assert.deepEqual(mlSyringe.warnings, []);

assert.equal(calculateDose({ vialMg: 5, finalVolumeMl: 0.5, doseMg: 0.25, syringeCapacityUnits: 100, syringeIncrementUnits: 0.5 }).syringeUnits, 2.5);
assert.ok(calculateReconstitution({ vialMg: 5, finalVolumeMl: 0.5, doseMg: 5, scalePerMl: 100, syringeCapacity: 30, syringeIncrement: 1 }).warnings.includes('exceeds_syringe'));

const macro = calculateDrip({ volumeMl: 500, hours: 6, minutes: 0, dropFactor: 20 });
assert.equal(macro.dropsPerMinute, 28); assert.ok(Math.abs(macro.mlPerHour - 83.3333) < 0.001);
const micro = calculateDrip({ volumeMl: 100, hours: 1, dropFactor: 60 });
assert.equal(micro.dropsPerMinute, 100); assert.equal(micro.mlPerHour, 100);

const pump = calculatePump({ volumeMl: 500, rateMlHour: 125 });
assert.equal(pump.wholeHours, 4); assert.equal(pump.remainingMinutes, 0);

const weight = calculateWeightDose({ prescribedMgKg: 10, weightKg: 20, availableMg: 500, availableVolumeMl: 5, maxDoseMg: 150 });
assert.equal(weight.doseMg, 200); assert.equal(weight.volumeMl, 2); assert.ok(weight.warnings.includes('exceeds_max_dose'));
const dailyWeight = calculateWeightDose({ prescribedMgKg: 40, weightKg: 10, availableMg: 250, availableVolumeMl: 5, regimen: 'daily', dosesPerDay: 4 });
assert.equal(dailyWeight.dailyDoseMg, 400); assert.equal(dailyWeight.doseMg, 100); assert.equal(dailyWeight.volumeMl, 2);
const infusionWeight = calculateWeightInfusion({ prescribedMcgKgMin: 0.5, weightKg: 70, availableMg: 200, availableVolumeMl: 100 });
assert.equal(infusionWeight.doseMcgMin, 35); assert.equal(infusionWeight.doseMgHour, 2.1); assert.equal(infusionWeight.mlHour, 1.05);

assert.equal(calculateDrip({ volumeMl: 0, hours: 1, dropFactor: 20 }).ok, false);
assert.equal(calculatePump({ volumeMl: 100, rateMlHour: 0 }).ok, false);
const oxygen = calculateOxygenDuration({ pressureBar: 150, reserveBar: 20, cylinderWaterVolumeL: 5, flowLMin: 5 });
assert.equal(oxygen.usableOxygenL, 650); assert.equal(oxygen.totalMinutes, 130); assert.equal(oxygen.wholeHours, 2); assert.equal(oxygen.remainingMinutes, 10);
const oxygenPlan = calculateOxygenDuration({ pressureBar: 100, reserveBar: 20, cylinderWaterVolumeL: 3, flowLMin: 6, plannedMinutes: 45, safetyMarginPercent: 20 });
assert.equal(oxygenPlan.totalMinutes, 40); assert.equal(oxygenPlan.requiredMinutes, 54); assert.ok(oxygenPlan.warnings.includes('insufficient_for_plan'));
assert.ok(calculateOxygenDuration({ pressureBar: 50, reserveBar: 20, cylinderWaterVolumeL: 2, flowLMin: 5 }).warnings.includes('critical_duration'));
assert.equal(calculateOxygenDuration({ pressureBar: 20, reserveBar: 20, cylinderWaterVolumeL: 5, flowLMin: 5 }).ok, false);
const compoundTarget = calculateCompoundLiquid({ mode: 'target', amount: 3.335, dropsPerMl: 20, targetComponentIndex: 0, components: [{ name: 'Escopolamina', concentrationMgMl: 6.67 }, { name: 'Dipirona', concentrationMgMl: 333.4 }] });
assert.equal(compoundTarget.volumeMl, 0.5); assert.equal(compoundTarget.drops, 10); assert.equal(compoundTarget.delivered[1].doseMg, 166.7);
const compoundDrops = calculateCompoundLiquid({ mode: 'drops', amount: 20, dropsPerMl: 20, components: [{ name: 'Escopolamina', concentrationMgMl: 6.67 }, { name: 'Dipirona', concentrationMgMl: 333.4 }] });
assert.equal(compoundDrops.volumeMl, 1); assert.equal(compoundDrops.delivered[0].doseMg, 6.67);
const compoundMl = calculateCompoundLiquid({ mode: 'ml', amount: 2, components: [{ name: 'A', concentrationMgMl: 10 }, { name: 'B', concentrationMgMl: 25 }] });
assert.equal(compoundMl.delivered[0].doseMg, 20); assert.equal(compoundMl.delivered[1].doseMg, 50);
const compoundDiluted = calculateCompoundLiquid({ mode: 'target', amount: 4, dropsPerMl: 20, targetComponentIndex: 0, preparation: 'diluted', sourceVolumeMl: 2, finalVolumeMl: 10, components: [{ name: 'Componente A', unit: 'mg', concentrationPerMl: 10 }, { name: 'Componente B', unit: 'mcg', concentrationPerMl: 100 }] });
assert.equal(compoundDiluted.volumeMl, 2); assert.equal(compoundDiluted.delivered[0].dose, 4); assert.equal(compoundDiluted.delivered[1].dose, 40); assert.equal(compoundDiluted.delivered[1].unit, 'mcg');
const compoundUi = calculateCompoundLiquid({ mode: 'ml', amount: 0.5, components: [{ name: 'Insulina regular', unit: 'UI', concentrationPerMl: 100 }] });
assert.equal(compoundUi.delivered[0].dose, 50); assert.equal(compoundUi.delivered[0].unit, 'UI');
assert.equal(calculateCompoundLiquid({ mode: 'ml', amount: 1, preparation: 'diluted', sourceVolumeMl: 5, finalVolumeMl: 2, components: [{ name: 'A', concentrationPerMl: 10 }] }).ok, false);
assert.equal(calculateCompoundLiquid({ mode: 'ml', amount: 1, components: [] }).ok, false);
console.log('Todos os testes da central de cálculos passaram.');
