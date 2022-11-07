# LANNISTER PAY ASSESSMENT(NodeJS Assessment) API Services

<h3>Introduction</h3>
<p>
  Lannister Pay is fictional Payment Processor, used for processing service.
  Lannister Pay have a Fee configuration Spec(FCS) used to described the applicable fees for each transaction.
</p>

### Major Endpoints for this assessment
| HTTP Verbs | Endpoints | Action |
| --- | --- | --- |
| POST | /fees | To create the Fee Configuration Spec(FCS) |
| POST | /compute-transaction-fee | To calculate or get the applicable transaction fee for each transaction based on the FCS |


### API Endpoints
| HTTP Verbs | Endpoints | Action |
| --- | --- | --- |
| POST | /fees | To create the Fee Configuration Spec(FCS) |
| GET | /fees | To get all Fee Configuration Spec created(FCS) |
| DELETE | /fees| To delete all Fee Configuration Spec(FCS) |
| POST | /compute-transaction-fee | To calculate or get the applicable ttransaction fee for each transaction based on the FCS |
