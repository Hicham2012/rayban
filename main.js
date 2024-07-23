import "./style.css"
import {runFacePipeline} from './src/run-face-pipline'

window.XR8 ? runFacePipeline() : window.addEventListener('xrloaded', runFacePipeline)