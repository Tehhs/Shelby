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
  //Find the human's name (TypeMatch() which searches for object by key 'type')
  TypeMatch("human_name").name("human_name").collapse([
    //Collapse the object into it's parent and rename object key 'value' to 'name'
    select("value").rename("name").set(true)
  ]).delete(),

  //Find the human's age
  TypeMatch("human_age").name("human_age").collapse([
    //Collapse the object into it's parent and rename object key 'value' to 'age'
    select("value").rename("age")
  ]).delete()

])
//Transform the object to type=human_information so future TypeMatch() calls can match it 
.transform("human_information")
console.log(JSON.stringify(segList, null, " "))

