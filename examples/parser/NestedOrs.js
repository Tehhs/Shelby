

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, MultiStringMatch, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

let segList = new SegmentList()
segList.append([
`person=`,
{type:"male", data: "123"}
])
segList.processStrings() 

const FemaleMatch = () => TypeMatch("female")
const MaleMatch = () => TypeMatch("male")
const HumanMatch = () => Or(
  FemaleMatch().name("female"), 
  MaleMatch().name("male")
)

segList = segList.find([
  StringMatch("person="),
  HumanMatch()
]).transform("value")


console.log("FINAL =", JSON.stringify(segList, null, " "))

