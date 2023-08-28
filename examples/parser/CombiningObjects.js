import { SegmentList, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";

let segList = new SegmentList()
segList.append([
  {type: "human_name", value: "James"},
  {type: "human_age", value: 25}
])

segList.processStrings() 

segList = segList
//Process Variable Declarations 
.find([
  TypeMatch("human_name").name("human_name").collapse([
    select("value").rename("NAMEE").set(true)
  ]),
  TypeMatch("human_age").name("human_age").collapse()
]).transform("human_information")
console.log(JSON.stringify(segList, null, " "))

