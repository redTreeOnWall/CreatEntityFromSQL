import * as mysql from 'mysql'
import * as readline from 'readline'
import * as fs from 'fs'
import { resolve } from 'path';

/**
 * you can edit this value
 */
var packageName = "com.lirunlong.saveGame"

class Clom{
    Field:string="unknow"
    Type = "Unknow"
    Comment="unknow"
}
class Table {
    name :string ="";
    cloms:Array<Clom> =  new Array();
}

var baseStruct = {
    tables:new Array <Table>()
}

var utils ={
    //首字母变成大写
    getClassNameFromTableName:(tableName:string)=>{
        var arr = tableName.split("")
        var big1= arr[0].toUpperCase();
        arr[0] = big1;
        var className = arr.join("");
        return className;
    },
    getJavaTypeFromColumType(columType:string){
        var stringPatten = /.*(varchar|text|char|datetime|time).*/i
        var stringmath = columType.match(stringPatten)
        if(stringmath!=null){
            return "String"
        }
        var intPatten = /.*(int).*/i
        var intmath = columType.match(intPatten)
        if(intmath!=null){
            return "int"
        }
        console.error("has a err:"+columType)
    }
}

// console.log(utils.getJavaTypeFromColumType("int"))

var getJavaClass = (table:Table,baseName:string)=>{
    var javaValus = ""

    for(var i = 0 ;i<table.cloms.length;i++){
        var javatype =utils.getJavaTypeFromColumType( table.cloms[i].Type)
        var javaValueName = table.cloms[i].Field
        javaValus = javaValus+`    public ${javatype} ${javaValueName};\r\n`
    }
    var javaCode = 
    
`
package ${packageName}.entity;
public class ${utils.getClassNameFromTableName( table.name)}Entity{
${javaValus}}
`
    return javaCode;
}



var dataBaseConfig = {
    host:"",
    passWord:"",
    base:""
}

var cmdList = [
    {
        question:"1.input address:",
        doInput:(host:string)=>{
            dataBaseConfig.host = host;
        }
    },
    {
        question:"2.input passWord:",
        doInput:(passWord:string)=>{
            dataBaseConfig.passWord = passWord;
        }
    },
    {
        question:"3.input dataBase name:",
        doInput:(basename:string)=>{
            dataBaseConfig.base = basename;
        }
    },
]


var start = async ()=>{


    console.log(dataBaseConfig)
    var connection = mysql.createConnection({
        host:dataBaseConfig.host,
        user:"root",
        password:dataBaseConfig.passWord,
        database:dataBaseConfig.base
    })
    connection.connect();

    var getTables = async ()=>{
        return new Promise(resolve =>{
            connection.query("show tables",(err:mysql.MysqlError,results:any,fields:mysql.FieldInfo[])=>{
                resolve(results)
            });
        })
    }

    var getCols = async (tablename:string)=>{
        return new Promise(resolve =>{
            connection.query(
                // `select COLUMN_NAME from information_schema.COLUMNS where table_name = '${tablename}' and table_schema = '${dataBaseConfig.base}';`
                `SHOW FULL COLUMNS FROM ${dataBaseConfig.base}.${tablename}`
                ,(err:mysql.MysqlError,results:any,fields:mysql.FieldInfo[])=>{
                    // console.log(err)
                resolve(results)
            });
        })
    }


    var tables :Array<any> = <Array<any>> await getTables();
    for(var i = 0; i<tables.length;i++){
        var tableName = tables[i]. Tables_in_lirunlong
        var table =  new Table()
        table.name = tableName;
        var colums :Array<Clom>=<Array<Clom>> await getCols(tableName)
        table.cloms = colums;
        baseStruct.tables[i] = table;
        // for(var colI = 0;colI< colums.length;i++){

        // }
        // return;
    }
    console.log("=> all table has been read.")

    var writeJavaFile = async (className:string,code:string)=>{
        return new Promise(resolve =>{
            fs.writeFile("./java/"+className+"Entity.java",javacode,(err)=>{
                if(err){
                    resolve("err")
                    console.log(err)
                }else{
                    resolve("suc") 
                }
            })
        })
    }

    fs.mkdir("./java/",()=>{});
    for(var i = 0;i<baseStruct.tables.length;i++){
        var javacode = getJavaClass(baseStruct.tables[i],"lirunlong")
        var className =utils.getClassNameFromTableName( baseStruct.tables[i].name)
        var result = await writeJavaFile(className,javacode)
        if(result == "suc"){
            console.log(className+".java has created.");
        }
    }

}



var cmdPoiter = 0;
console.log(cmdList[cmdPoiter].question)
var rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout
})
rl.on("line",(ip:any)=>{
    cmdList[cmdPoiter].doInput(ip)
    if(cmdPoiter==cmdList.length-1){
        console.log("end")
        rl.close()
        start()
    }else{
        cmdPoiter++
        console.log(cmdList[cmdPoiter].question)
    }
})
