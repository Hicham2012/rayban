import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Builds the 3d glasses object from a GLB and lens materials.
const buildGlasses = (loader) => {
  const glasses = new THREE.Object3D()

  // add frame glb.
  loader.load('/assets/Models/rayban_v2_Edited3.glb', (glassesObj) => {
    glassesObj.scene.scale.set(1.1, 1.1, 1.1)
    glasses.add(glassesObj.scene)
  })

  return glasses
}

// Builds a scene object with a mesh, an occluder, and sun glasses, and manages state updates to
// each component.
const buildHead = () => {
  // head is anchored to the face.
  const head = new THREE.Object3D()
  head.visible = false

  // Glasses are attached to the nose at a slight offset.
  const loader = new GLTFLoader()
  const glasses = buildGlasses(loader)
  // glasses.position.copy(new THREE.Vector3(0, 0.05, 0))
  const noseAttachment = new THREE.Object3D()
  noseAttachment.add(glasses)
  head.add(noseAttachment)

  // Update geometry on each frame with new info from the face controller.
  const show = (event) => {
    const {transform, attachmentPoints} = event.detail

    // Update the overall head position.
    head.position.copy(transform.position)
    head.setRotationFromQuaternion(transform.rotation)
    head.scale.set(transform.scale, transform.scale, transform.scale)

    // Update the nose position.
    noseAttachment.position.copy(attachmentPoints.noseBridge.position)

    // Update the face mesh.
    head.visible = true
  }

  // Hide all objects.
  const hide = () => {
    head.visible = false
  }

  return {
    object3d: head,
    show,
    hide,
  }
}

// Build a pipeline module that initializes and updates the three.js scene based on facecontroller
// events.
const faceScenePipelineModule = () => {
  // Start loading mesh url early.
  let canvas_
  let modelGeometry_

  // Stores the head mesh instances by faceId.
  let faceIdToHead_

  // init is called by onAttach and by facecontroller.faceloading. It needs to be called by both
  // before we can start.
  const init = ({canvas, detail}) => {
    canvas_ = canvas_ || canvas
    modelGeometry_ = modelGeometry_ || detail

    if (!(canvas_ && modelGeometry_)) {
      return
    }

    // Get the 3js scene from XR
    const {scene} = XR8.Threejs.xrScene()

    // sets render sort order to the order of objects added to scene (for alpha rendering).
    THREE.WebGLRenderer.sortObjects = false

    // add lights.
    const targetObject = new THREE.Object3D()
    targetObject.position.set(0, 0, -1)
    scene.add(targetObject)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.castShadow = true
    directionalLight.position.set(0, 0.25, 0)
    directionalLight.target = targetObject
    scene.add(directionalLight)

    const bounceLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5)
    scene.add(bounceLight)

    // We generate the three head meshes ahead of time, but by default they are not visible.
    faceIdToHead_ = buildHead()
    scene.add(faceIdToHead_.object3d)

    // prevent scroll/pinch gestures on canvas.
    canvas_.addEventListener('touchmove', (event) => event.preventDefault())
  }

  const onDetach = () => {
    canvas_ = null
    modelGeometry_ = null
  }

  // Update the corresponding face mesh based on the faceId.
  const show = (event) => faceIdToHead_.show(event)
  const hide = (event) => faceIdToHead_.hide()

  return {
    name: 'facescene',
    onAttach: init,
    onDetach,
    listeners: [
      {event: 'facecontroller.faceloading', process: init},
      {event: 'facecontroller.facefound', process: show},
      {event: 'facecontroller.faceupdated', process: show},
      {event: 'facecontroller.facelost', process: hide},
    ],
  }
}

export {faceScenePipelineModule}