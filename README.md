# AWS Google Proxy
Develop a scaleable search proxy server for google.com utilizing IaaS and standard programming stack technologies.
## Functional Requirements
- Consider the domain google.com as not directly accessible
- www.google.com to be accessible indirectly via $ADDRESS:8080 where ADDRESS is the URL of the proxy server
- Google search terms are appended
- Example: $ADDRESS:8080/bose will return Google search results for the search term `bose`
- Search result URLs to other websites will return a re-direct
- Related search URL's returned in the search results will resolve through the proxy

## Non-Functional Requirements

- One Step infrastructure packaging and deployment
- Auto-scaling
- Highly available
- HTTP-only
- Manual code build and deploy - no build pipeline
- Future: Use AWS Code Build and Pipeline via **mu** (https://github.com/stelligent/mu)

`Note:` I did not implement a CI/CD pipeline due to time and AWS costs for myself.  **mu** completely automates the process of managing multiple deployment environments and pipelines without any additional overhead or dependencies.

## Infrastructure Solution
![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/google-proxy-blueprint.png)

The chosen solution for a scalable proxy service is:
- AWS VPC including public subnets across three AWS Availability Zones within a single Region
- AWS EC2 Application Load Balancing (ALB)
- AWS ECS/Fargate - no EC2 instances rather configurable Fargate cluster nodes
- EC2/ECS Service Auto-Scaling - ECS service is configured with a target-tracking auto scaling policy
- AWS infrastructure is deployed via a configurable CloudFormation template `cf-template.yaml` described in the Installation section

`Note:` ECS Fargate is available in about 60% of the AWS global regions - this solution must be deployed in one of enabled regions
### Infrastructure Tradeoffs
Keeping with the notion of serverless, or microservices, it was determined that AWS Lambda functions and API Gateway would not meet the Functional Requirement of listening on port 8080.   The next, most elegant solution decision was to use Docker and EC2 Application Load Balancing and ECS/Fargate technologies.


## Code Solution

The implementation of the proxy server `server.js` is via a `nodejs` webserver solution utilizing the `express` and `request` node packages.

Nodejs and Express are a very simple, concurrent software solution for serving web pages:
- simple express web server listening on port 8080
- If the Request path is /url, then the browser is redirected to the search result
- Otherwise, query parameters are parsed according to Functional Requirements and passed to https://www.google.com/search
- Content from Google is then returned

### Server Code
The `server.js` code is shown below.
In the callback for HTTP GET requests made to the server:
- First a check is made for the path /url
- If /url, this means it is a request to one of the search results and the a redirect is made back to the client

- Otherwise, before a search request is made to Google, some hacking of the request query parameters is made.  This logic was determined by some painstaking testing and observation of Google-generated HTML `<a>` tags

``` javascript
'use strict';

const express = require('express');
const request = require('request');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.get('*', (req, response) => {

	console.log("request path=" + JSON.stringify(req.path))
    console.log("request parameters=" + JSON.stringify(req.params))
    console.log("request query=" + JSON.stringify(req.query))



  	if (req.path === '/url' && req.query.q != null) {
  		// this is a google search result
  		// redirect to req.query.q
  		response.redirect(req.query.q);

  	}
  	else {

			var path = '/search?q='+req.path.substr(1);
	   	var host = 'https://www.google.com';

			if ((req.path === '/search' || req.path === '/advanced_search')
				&& req.query.q != null) {
			  	// this is an embedded search
			  	path = '/search?q=' + req.query.q
			  	// check to see if this is a pagination
			  	if (req.query.start != null) {
			  		path = path + '&start=' + req.query.start
			  	}
				// is this is time-based search?
				else if (req.query.tbs != null) {
					path = path + '&tbs=' + req.query.tbs
				}
				// is this is a images, video, news, shopping, books query?
				if (req.query.tbm != null ){
					path = path + '&tbm=' + req.query.tbm
				}
			}
		 	console.log('google search path=' + path)
			// make the search request to www.google.com
			request(host+path,
				(error, resp, body) =>
			{
			    response.send(body)
			});

  	}

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
```
`Note:` Google Maps and other related sites are not covered by this proxy server

### Code Deployment
The nodejs proxy webserver is built and deployed as a Docker image using the project `Dockerfile` and associated build artifacts `package.json` and `server.js`. By default, the Docker image is accessible via the public repository docker.io/wattage/google-proxy.  If AWS ECR private container registry is desired, the image can be pushed to an ECR repository within the same AWS account as the running CloudFormation stack.  By default, ECS Fargate nodes are configured with IAM permissions to access ECR images.


## Prerequisites
- AWS account with IAM user having sufficient privileges to create resources via CloudFormation

## Installation and Configuration
This is a one-step install on AWS.  The Docker image is kept at docker.io/wattage/google-proxy and is configurable via the CloudFormation input parameters.

### CloudFormation Console - Create New Stack
- Choose an AWS Region that supports ECS Fargate
- https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/
- Choose to upload the CloudFormation template file `cf-template.yaml`

![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/cloudformation-template-parameters.png)

- choose a unique stack name
- You must select **three** availability zones
- defaults should work fine
- if you would like to change the Fargate cluster node memory and/or cpu capacity for scaling up, please see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
- If you would like to scale out, change the parameters DesiredEcsServiceCount, MinEcsServiceCount, and MaxEcsServiceCount
- The parameter EcsServiceCpuTargetValue controls the CPU threshold after which scale out occurs
- ECS container scheduling will evenly distribute containers across multiple availability zones
- ECS container reservation is configured such that one container will run on each Fargate node - this may be suboptimal although was simplest in term of implementation of the CloudFormation stack template
- Don't forget to 'check' the final confirmation indicating that IAM Roles may be created and/or modified

![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/cloudformation-template-capabilities.png)


After the CloudFormation stack completes, go to the `Outputs` tab to see the URL for the proxy server:


![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/cloudformation-stack-outputs.png)

### Optional
- The Docker image can be built locally using the `build.sh` script on a workstation with Docker installed
- If desired, a private ECR repository can be manually created in the same AWS account as the CloudFormation stack and the image pushed
- The Docker image URL used by ECS is configurable as a CloudFormation template parameter
- The Docker container can be run locally using the command `docker run -it -p 8080:8080 wattage/google-proxy` where the host port and image name may need to be adjusted
