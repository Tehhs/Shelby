

import { EngineEvents, Group, SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const Variable = () => Group(
  StringMatch("$"), 
  Alphabetical().name("name").join()
)

let segList = new SegmentList()
segList.append([`let $varName = 3`])


segList = segList.find([
  Variable()
  //!NEXT, we want to do Variable().name("name") to affect the main token function in the group
]).transform("variable")

console.log("FINAL =", JSON.stringify(segList, null, " "))

