import assert from 'node:assert/strict';
import { calculateReconstitution, calculateDose, calculateDrip, calculatePump, calculateWeightDose } from './calculator.js';

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

assert.equal(calculateDrip({ volumeMl: 0, hours: 1, dropFactor: 20 }).ok, false);
assert.equal(calculatePump({ volumeMl: 100, rateMlHour: 0 }).ok, false);
console.log('Todos os testes da central de cálculos passaram.');
