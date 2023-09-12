find a way to deal with list of things 
find a wsya to deal with optional things 


 * End statements 
 */
brandNewSegments = findAndSegment(brandNewSegments, [
    {
        validator: StringMatch("end"), 
        truthFunction: (segs) => segs.join("")=="end"
    }
], function() { 
    return {type: "end"}
}) 

const returns = { 
    save: 1, //save result, true 
    load: 2, //return the last saved result, false,
    ignore: 3, //ignore this token and reset, for optional

}

Segments.find([
    OR(StringMatch("public"), StringMatch("protected")),
    Opt(StringMatch("static")).name("static").propagte(),
    StringMatch("void"), 
    FunctionName().name("FunctionName").propagate()
    MethodBlock().name("method_block").propagate(),
    Opt(StringMatch(",")).reset() 
).transform("method") 



find(
    StringMatch("["),
    alphanumeric(),
    if(comma()).then(
        alphanumeric(), 
        self() // the if condition
    )
    StringMatch("]")
).to("list")

find(
    StringMatch("A"), 
    if(StringMatch("B")).then(
        StringMatch("C"),
        if(StringMatch("D")).then(
            StringMatch("E")
        )
    ).elseif(StringMatch("5")).then(StringMatch("6"))
    .else(
        StringMatch("6"),
        StringMatch("7")
    )
).to("alphabet")

todo 
better way to handle scopes 
tokenfunction generators should use allow() for things like Alphanumeric() and numeric()
exttra object keys after transform besides object type 
final transform operation function to change the object after all other transform operations (so we can use custom js to finalise everything)


access_type => "public", "private", "protected" 
    name: "access_type"
static_keyword.opt => "static" 
    optional: true 
return_type => "void", "int", "string"
name => $alphanumeric

java_method_decl = access_type, static_keyword.opt, return_type, name



#name = 4 
variable = Sequence(
    StringM("#").reference("stringmatch1"), 
    Alphabetical().actor()
)

variable().name("variable")

ALSO FOR OR LOGIC 
in the events, there should be a function where you put in the tf and get returned the tfobjs 
    and maybe store the last returned state of each tfobj

    so at the end of the or list (list pushed in and is flat) we can check the statuses of each 

    a way to mutate every reject into nextTokenFunction() 

    if accept before list end, a way to skip() to desired token function + offset


