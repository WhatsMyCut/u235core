'use strict'
const AWS = require('aws-sdk')
const qs = require('querystring')
const programDocumentsBucket = 'programDocuments'

module.exports = {
  getURL({ bucket, key }) {
    return '/stored-files?' + qs.stringify({ bucket, key })
  },

  copyDocument({
    sourceBucket,
    sourceKey,
    destBucket,
    destKey,
    contentDisposition
  }) {
    let s3 = new AWS.S3()
    let copyArgs = {
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${sourceKey}`,
      ContentDisposition: contentDisposition,
    }
    return s3.copyObject(copyArgs).promise()
  },

  saveDocument(args) {
    let bucket = args.bucket
    let filename = args.filename
    let key = args.key
    let fileStream = args.fileStream

    let s3 = new AWS.S3()
    let cd = 'attachment; filename=' + filename
    let params = { Bucket: bucket, Key: key, Body: fileStream, ContentDisposition: cd }

    return new Promise(function(resolve, reject) {
      s3.upload(params).send(function(err) {
        if (err) { return reject(err) }

        params = { Bucket: bucket, Key: key, Expires: 63072000 }
        s3.getSignedUrl('getObject', params, function(err, url) {
          if (err) { return reject(err) }
          resolve(url)
        })
      })
    })
  },

  deleteDocument(bucket, key) {
    let s3 = new AWS.S3()
    let params = { Bucket: bucket, Key: key }

    return new Promise(function(resolve, reject) {
      s3.deleteObject(params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  },

  ensureBucketExists(bucket, acl) {
    let s3 = new AWS.S3()

    return new Promise((resolve, reject) => {
      s3.headBucket({ Bucket: bucket }, (err, data) => {
        if (err) {
          return s3.createBucket({ Bucket: bucket, ACL: acl }, (err, data) => {
            if (err) {
              reject(err)
            } else {
              resolve(true)
            }
          })
        } else {
          resolve(true)
        }
      })
    })
  }
}
