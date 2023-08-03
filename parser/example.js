import { captureStrings, split, findAndSegment } from "./engine.js"
import fs from "fs"

let strArray =    [`
    :name "Liam" 
    :age 25 

    if age >= 20 then 
        print(":name is old")
    else 
        print(":age is young!")
    end 
`]

/**
 * {type: "Variable Decl", value: {type: "String", contents: "Liam"}}
 * {type: "Variable Decl", value: {type: "Integer", contents: "25"}}
 * {type: "Conditional", condition: {}, if: [
 *  {type: "MethodCall", value: {type: "String", contents: ":name is old"}}
 * ], else: [
 *  {type: "MethodCall", value: {type: "String", contents: ":name is young!"}}
 * ]}
 */
