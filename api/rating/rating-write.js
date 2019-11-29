import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

async function fetchPostDetails(postId) {
  let item;
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: postId
    }
  };

  try {
    let postResult = await dynamoDbLib.call("get", params);
    item = postResult.Item;
  } catch(e) {
    //do nothing
  }

  return item;
}

async function sendEmailToAuthor(postId, rating) {
  let post = await fetchPostDetails(postId);
  let emailId = await userNameLib.getAuthorEmail(post.userId);

  const title = `Naadan Chords - Someone rated ${post.title}`;
  const message = `
    <p>Hey,</p>
    <p>Someone just submitted a new rating on your post <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
    <p>The rating: <b>${rating}</b> stars</p>
    <p>Thanks for being a contributor!</p>
  `;
  const textMessage = `New rating on your post ${post.title}\n\nRating: ${rating}`;

  await emailLib.sendEmail(title, message, textMessage, emailId);
}

async function appendTitles(ratingMap) {
  let filterExpression = "";
  let expressionAttributeValues = {};
  let i = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      if(filterExpression) {
        filterExpression += ` OR contains(postId, :postId${i})`;
      } else {
        filterExpression = `contains(postId, :postId${i})`;
      }
      expressionAttributeValues[`:postId${i}`] = postId;
      i++;
    }
  }

  let params = {
    TableName: "NaadanChords",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ProjectionExpression: "postId, title"
  };

  try {
    let itemsResult = await dynamoDbLib.call("scan", params);
    let items = itemsResult.Items;
    
    for(let i = 0; i < items.length; i++) {
      ratingMap[items[i].postId].title = items[i].title;
    }
  } catch(e) {
    //Do nothing
  }

  return ratingMap;
}

function constructRatingMap(result) {
  let ratingMap = {};

  for(let i = 0; i < result.Items.length; i++) {
    let item = result.Items[i];
    if(ratingMap.hasOwnProperty(item.postId)) {
      let existingItem = ratingMap[item.postId];
      let newCount = existingItem.count + 1;
      let newRating = ((existingItem.rating * existingItem.count) + item.rating) / newCount;

      ratingMap[item.postId] = {
        rating: newRating,
        count: newCount
      }
    } else {
      ratingMap[item.postId] = {
        rating: item.rating,
        count: 1
      }
    }
  }

  return ratingMap;
}

function calculateWeightedRatings(ratingMap) {
  let totalAverageRating, totalAverage = 0, totalCount = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = ratingMap[postId];
      totalAverage += item.rating;
      totalCount++;
    }
  }

  totalAverageRating = totalAverage / totalCount;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let averageRating = ratingMap[postId].rating;
      let ratingCount = ratingMap[postId].count;
      let tuneParameter = 25000;

      let weightedRating = (ratingCount / (ratingCount + tuneParameter)) * averageRating + (tuneParameter / (ratingCount + tuneParameter)) * totalAverageRating;
      ratingMap[postId].weightedRating = weightedRating;
    }
  }
  return ratingMap;
}

async function saveRatings(ratingMap) {
  let itemsArray = [];

  ratingMap = calculateWeightedRatings(ratingMap);
  ratingMap = await appendTitles(ratingMap);

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = {
        PutRequest : {
          Item : {
            postId: postId,
            postType: "POST",
            ...ratingMap[postId]
          }
        }
      };
      itemsArray.push(item);
    }
  }

  const params = {
    RequestItems: {
      "NaadanChordsRatings": itemsArray
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES"
  };

  try {
    let result = await dynamoDbLib.batchCall(params);
    return result;
  } catch(e) {
    return e;
  }
}

async function generateRatings() {
  let params = {
    TableName: "NaadanChordsRatingsLog",
    ProjectionExpression: "postId, rating"
  };

  try {
    let ratingMap = {};
    let result = await dynamoDbLib.call("scan", params);
    ratingMap = constructRatingMap(result);
    while(result.hasOwnProperty("LastEvaluatedKey")) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("scan", params);
      ratingMap = constructRatingMap(result);
    }
    let saveRatingsResponse = await saveRatings(ratingMap);
    return saveRatingsResponse;
  } catch(e) {
    return false;
  }
}

export async function main(event, context, callback) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  //basic validation
  let rating = data.rating;
  if(rating < 0 || rating > 5) {
    return failure({ status: false, message: "Invalid rating" });
  }

  let params = {
    TableName: "NaadanChordsRatingsLog",
    Item: {
      postId: data.postId,
      rating: rating,
      userId: sub
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    await sendEmailToAuthor(data.postId, rating);
    await generateRatings();
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}