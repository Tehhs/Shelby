

import { EngineEvents, Group, SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, Numerical, Or, OrGroup, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const Variable = () => Group(
  Group(
    StringMatch("$"), 
    Alphabetical().name("name").join()
  )
)

let segList = new SegmentList()
segList.append([`pin: $vName = 3`])


segList = segList.find([
  OrGroup(
    StringMatch("let").name("__"),
    StringMatch("pin").name("__"), 
    StringMatch("var").name("__")
  ).name("CC"),
  StringMatch(":")
]).transform("variable")

console.log("FINAL =", JSON.stringify(segList, null, " "))

