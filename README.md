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

## Infrastructure Solution
![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/google-proxy-blueprint.png)

The chosen solution for a scalable proxy service is:
- AWS VPC including public subnets across three AWS Availability Zones within a single Region
- AWS EC2 Application Load Balancing (ALB)
- AWS ECS/Fargate - no EC2 instances rather configurable Fargate cluster nodes
- EC2/ECS Service Auto-Scaling - ECS service is configured with a target-tracking auto scaling policy
- AWS infrastructure is deployed via a configurable CloudFormation template `cf-template.yaml` described in the Installation section

`Note:` ECS Fargate is available in about 50% of the AWS global regions - this solution must be deployed in one of enabled regions
### Infrastructure Tradeoffs
Keeping with the notion of serverless, or microservices, it was determined that AWS Lambda functions and API Gateway would not meet the Functional Requirement of listening on port 8080.   The next, most elegant solution decision was to use Docker and EC2 Application Load Balancing and ECS/Fargate technologies.


## Code Solution

The implementation of the proxy server `server.js` is via a `nodejs` webserver solution utilizing the `express` and `request` node packages.

Nodejs and Express are a very simple, scalable software solution:
- simple web server listening on port 8080
-
- If the Request path is /url, then the browser is redirected to the search result
- Otherwise, query parameters are parsed according to Functional Requirements and passed to https://www.google.com/search

### Code Deployment
The nodejs proxy webserver is built and deployed as a Docker image using the project `Dockerfile` and associated build artifacts `package.json` and `server.js`. By default, the Docker image is accessible via the public repository docker.io/wattage/google-proxy.  If AWS ECR private container registry is desired, the image can be pushed to an ECR repository within the same AWS account as the running CloudFormation stack.  By default, ECS Fargate nodes are configured with IAM permissions to access ECR images.


## Prerequisites


## Installation

### CloudFormation Console - Create New Stack
- Choose an AWS Region that supports ECS Fargate
- https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/
- Choose to upload `cf-template.yaml`

![alt text](https://github.com/pfriedland/aws-google-proxy/blob/master/cloudformation-template-parameters.png)
