import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as lambda from "@aws-cdk/aws-lambda";
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as cdk from "@aws-cdk/core";
import { Condition, Pass } from "@aws-cdk/aws-stepfunctions";

//https://github.com/richardhboyd/aws-step-functions
//https://raw.githubusercontent.com/richardhboyd/aws-step-functions/master/CDK/lib/sfn_cdk-stack.ts
//https://www.youtube.com/watch?v=T9iehMn5xHw&feature=emb_logo

export class CdkStepfunctionStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: cdk.StackProps = {}) {
        super(scope, id, props);

        const functionGenerateID = new lambda.Function(this, "GenerateID", {
          runtime: lambda.Runtime.NODEJS_12_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(`
            const generate = () => Math.random().toString(36).substring(7);

            exports.handler = async () => ({"value": generate()});
          `),
        });

        const functionReverseID = new lambda.Function(this, "ReverseID", {
          runtime: lambda.Runtime.NODEJS_12_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(`
            const reverse = (str) => (str === '') ? '' : reverse(str.substr(1)) + str.charAt(0);
    
            exports.handler = async (state) => ({"value": reverse(state.value)});
          `),
        });

        const functionFirstParallel = new lambda.Function(this, "FirstParallelFunction", {
          runtime: lambda.Runtime.NODEJS_12_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(`
            exports.handler = async (state) => (console.log("This is branch number one !"));
          `),
        });

        const functionSecondParallel = new lambda.Function(this, "SecondParallelFunction", {
          runtime: lambda.Runtime.NODEJS_12_X,
          handler: "index.handler",
          code: lambda.Code.fromInline(`
            exports.handler = async (state) => (console.log("This is branch number two !"));
          `),
        });

        const generateIdTask = new tasks.LambdaInvoke(this, "Generate ID", {
          lambdaFunction: functionGenerateID,
          outputPath: "$.Payload",
        });

        const waitTask = new sfn.Wait(this, "Wait 1 Second", {
          time: sfn.WaitTime.duration(cdk.Duration.seconds(1)),
        })

        const reverseeIdTask = new tasks.LambdaInvoke(this, "Reverse ID", {
          lambdaFunction: functionReverseID,
          outputPath: "$.Payload",
        })

        const firstParallelTask = new tasks.LambdaInvoke(this, "First Parallel Task", {
          lambdaFunction: functionFirstParallel,
          outputPath: "$.Payload",
        });

        const secondParallelTask = new tasks.LambdaInvoke(this, "Second Parallel Task", {
          lambdaFunction: functionSecondParallel,
          outputPath: "$.Payload",
        });

        const stepChain = new sfn.Parallel(this, 'taskParallelTasks', {}).branch(firstParallelTask).branch(secondParallelTask);

        const definition = generateIdTask
        .next(waitTask)
        .next(reverseeIdTask)
        .next(stepChain);

        const machine = new sfn.StateMachine(this, "StateMachine", {
          definition,
          timeout: cdk.Duration.minutes(5),
        });       
    }
}

