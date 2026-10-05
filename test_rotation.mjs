import * as THREE from 'three';

function testRotation(rx, ry, rz, order) {
    console.log(`\nTesting: ${rx} ${ry} ${rz} ${order}`);
    const root = new THREE.Group();
    root.rotation.set(rx, ry, rz, order);
    root.updateMatrixWorld(true);

    const left = new THREE.Vector3(1, 0, 0);   // GLB +X
    const up = new THREE.Vector3(0, 1, 0);     // GLB +Y
    const forward = new THREE.Vector3(0, 0, 1); // GLB +Z

    left.applyMatrix4(root.matrixWorld);
    up.applyMatrix4(root.matrixWorld);
    forward.applyMatrix4(root.matrixWorld);

    const l = new THREE.Matrix4().scale(new THREE.Vector3(1, -1, 1));
    left.applyMatrix4(l);
    up.applyMatrix4(l);
    forward.applyMatrix4(l);

    console.log("GLB Left (+X) points to:    ", left.toArray().map(n => Math.round(n)));
    console.log("GLB Up (+Y) points to:      ", up.toArray().map(n => Math.round(n)));
    console.log("GLB Forward (+Z) points to: ", forward.toArray().map(n => Math.round(n)));
}

testRotation(Math.PI/2, 0, Math.PI, 'XYZ');
testRotation(Math.PI/2, Math.PI, 0, 'XYZ');
testRotation(-Math.PI/2, 0, 0, 'XYZ');
testRotation(Math.PI/2, 0, 0, 'XYZ');
testRotation(Math.PI/2, 0, 0, 'ZYX');
console.log("GLB Up (+Y) points to:      ", up.toArray().map(n => Math.round(n)));
console.log("GLB Forward (+Z) points to: ", forward.toArray().map(n => Math.round(n)));

// Now apply MapLibre's L matrix (heading 0)
const heading = 0;
const l = new THREE.Matrix4()
    .scale(new THREE.Vector3(1, -1, 1))
    .multiply(new THREE.Matrix4().makeRotationZ(-heading * Math.PI / 180));

left.applyMatrix4(l);
up.applyMatrix4(l);
forward.applyMatrix4(l);

console.log("\nAfter MapLibre 'L' matrix (Heading 0):");
console.log("GLB Left (+X) points to:    ", left.toArray().map(n => Math.round(n)));
console.log("GLB Up (+Y) points to:      ", up.toArray().map(n => Math.round(n)));
console.log("GLB Forward (+Z) points to: ", forward.toArray().map(n => Math.round(n)));
