#!/usr/bin/env node
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, FileSystem, Layer, Schema } from "effect"
import { Argument, Command, Flag } from "effect/cli"
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http"

class CliFetchError extends Schema.TaggedError<CliFetchError>()("CliFetchError", {
    url: Schema.String,
    cause: Schema.Defect(),
}) {}

const DocsTopic = Schema.Struct({
    id: Schema.String,
    title: Schema.optional(Schema.String),
    markdown: Schema.optional(Schema.String),
})

const DocsTopics = Schema.Array(DocsTopic)

const OpenApiSpec = Schema.Record(Schema.String, Schema.Unknown)

const fetchSchema = Effect.fn("fetchSchema")(function* <S extends Schema.Top>(url: string, schema: S) {
    const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.mapRequest(HttpClientRequest.acceptJson),
        HttpClient.filterStatusOk,
    )
    return yield* client.get(url).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
        Effect.mapError((cause) => new CliFetchError({ url, cause })),
    )
})

const emit = Effect.fn("emit")(function* (text: string, output: string) {
    if (output.length === 0) {
        yield* Console.log(text)
        return
    }
    const fs = yield* FileSystem.FileSystem
    yield* fs.writeFileString(output, text)
})

function originOf(baseUrl: string): string {
    return baseUrl.replace(/\/$/, "")
}

const endeavour = Command.make("endeavour").pipe(
    Command.withSharedFlags({
        baseUrl: Flag.String("base-url").pipe(
            Flag.withDescription("API origin"),
            Flag.withDefault("https://app.dev.kevinkraemer.com"),
        ),
    }),
    Command.withDescription("Script the Endeavour public docs API"),
)

const list = Command.make(
    "list",
    {
        json: Flag.Boolean("json").pipe(Flag.withDescription("Print raw JSON"), Flag.withDefault(false)),
    },
    Effect.fn("list")(function* ({ json }) {
        const root = yield* endeavour
        const topics = yield* fetchSchema(`${originOf(root.baseUrl)}/api/docs`, DocsTopics)
        if (json) {
            yield* Console.log(JSON.stringify(topics, null, 2))
            return
        }
        yield* Console.log(topics.map((topic) => `- ${topic.id}: ${topic.title ?? ""}`.trimEnd()).join("\n"))
    }),
)

const read = Command.make(
    "read",
    {
        id: Argument.String("id").pipe(Argument.withDescription("Topic id")),
    },
    Effect.fn("read")(function* ({ id }) {
        const root = yield* endeavour
        const topic = yield* fetchSchema(
            `${originOf(root.baseUrl)}/api/docs/${encodeURIComponent(id)}`,
            DocsTopic,
        )
        yield* Console.log(topic.markdown ?? JSON.stringify(topic, null, 2))
    }),
)

const docs = Command.make("docs").pipe(
    Command.withDescription("Read the public docs API"),
    Command.withSubcommands([list, read]),
)

const openapi = Command.make(
    "openapi",
    {
        output: Flag.String("output").pipe(
            Flag.withAlias("o"),
            Flag.withDescription("Write to FILE instead of stdout"),
            Flag.withDefault(""),
        ),
    },
    Effect.fn("openapi")(function* ({ output }) {
        const root = yield* endeavour
        const spec = yield* fetchSchema(`${originOf(root.baseUrl)}/openapi.json`, OpenApiSpec)
        yield* emit(JSON.stringify(spec, null, 2), output)
    }),
)

const AppLayer = Layer.mergeAll(NodeServices.layer, FetchHttpClient.layer)

endeavour.pipe(
    Command.withSubcommands([docs, openapi]),
    Command.run({ version: "0.1.0" }),
    Effect.provide(AppLayer),
    NodeRuntime.runMain,
)
