

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, MultiStringMatch, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const BooleanType = () => MultiStringMatch("true", "false") 
const StringType = () => TypeMatch("string")
const Item = () => Or(Numerical(), BooleanType())
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`false 12`])
segList.processStrings() 


segList = segList.find([
  Or(Numerical(), StringMatch("false")).name("value").join()
]).transform("variable_value")


console.log("FINAL =", JSON.stringify(segList, null, " "))

