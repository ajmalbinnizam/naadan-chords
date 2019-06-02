import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export async function main(event, context, callback) {
  if(!event.userName) {
    return { status: false, error: "No username specified" };
  }

  let userId = await userNameLib.getUserId(event.userName);

  if(userId === "") {
    return [];
  }

  var lastEvaluatedKey;
  if(event.page) {
    var page = event.page - 1;

    if(page > 0) {
      let skipParams = {
        TableName: "NaadanChords",
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "postType = :postType",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":postType": event.postType ? event.postType : "POST"
        },
        ScanIndexForward: false,
        ProjectionExpression: "postId",
        Limit: 15 * page
      };

      try {
        var skipResult = await dynamoDbLib.call("query", skipParams);
        if(skipResult.hasOwnProperty("LastEvaluatedKey")) {
          lastEvaluatedKey = skipResult.LastEvaluatedKey;
        } else {
          return [];
        }
      } catch(e) {
        return { status: false, error: e };
      }
    } else if(page !== 0) {
      return [];
    }
  }

  let params = {
    TableName: "NaadanChords",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":postType": event.postType ? event.postType : "POST"
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15
  };

  if(event.search) {
    //search
    params.FilterExpression = "contains(postId, :postId) AND postType = :postType";
    params.ExpressionAttributeValues = {
        ":userId": userId,
        ":postId": slugify(event.search),
        ":postType": event.postType ? event.postType : "POST"
    };
    params.ProjectionExpression = "postId, createdAt, postType, title, userId";
  }

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }

  if(lastEvaluatedKey) {
    //pagination
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  try {
    let result = {};
    result = await dynamoDbLib.call("query", params);

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);

    if(result.Items.length > 0) {
      for(let i = 0; i < result.Items.length; i++) {
        result.Items[i].userName = authorAttributes.userName;
        result.Items[i].authorName = authorAttributes.authorName;
        delete(result.Items[i].userId);
      }
    }
    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}