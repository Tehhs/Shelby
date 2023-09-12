

import { EngineEvents, SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, Group, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const Item = () => Alphanumeric() 
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`Apple pie`])

const reference = StringMatch("cram")

segList = segList.find([
  //! NTEXT, GET TOKEN FUNCTIONS TO UNFOLD INTO OTHER TOKEN FUNCTIONS
  StringMatch("Apple ").name('fruit').on(EngineEvents.OPERATION_EVALUATED, 
    (context, {self}) => {
      const {changeTokenOperation, operationEvaluation, shiftToTokenFunction} = context; 
      shiftToTokenFunction(reference)
      console.log(operationEvaluation)
      //debugger
    }
  ),
  StringMatch("pie "), 
  reference 
  
]).transform("transformation")

console.log("FINAL =", JSON.stringify(segList, null, " "))

