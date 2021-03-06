import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "No write permissions" });
  }

  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: event.pathParameters.id
    },
    UpdateExpression: "SET title = :title, song = :song, album = :album, singers = :singers, music = :music, category = :category, image = :image, scale = :scale, tempo = :tempo, timeSignature = :timeSignature, content = :content, leadTabs = :leadTabs, youtubeId = :youtubeId, postType = :postType",
    ExpressionAttributeValues: {
      ":title": data.title || null,
      ":song": data.song || null,
      ":album": data.album || "PAGE",
      ":singers": data.singers || null,
      ":music": data.music || null,
      ":category": data.category || (data.postType === "POST" ? "MALAYALAM" : "PAGE"),
      ":image": data.image || null,
      ":scale": data.scale || null,
      ":tempo": data.tempo || null,
      ":timeSignature": data.timeSignature || null,
      ":content": data.content || null,
      ":leadTabs": data.leadTabs || null,
      ":youtubeId": data.youtubeId || null,
      ":postType": data.postType || "POST"
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}