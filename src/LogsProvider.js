const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const { generateDocName } = require("./common/commons");

class LogsProvider extends CompanyProvider {

  constructor(serviceAccount) {
		super(serviceAccount);
  }

	async save(company, machine, id, data) {
		const hasCompany = await this.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("ID não encontrado");

		const document = hasCompany.docs[0].ref
			.collection(this.collectionCompanyLogs)
			.doc(generateDocName());
				
		return await document.set({ 
			sensorId: id,
			machine,
			...data,
			id: uuidv4(),
		});
	}

	async getLogs(company) {
		const hasCompany = await this.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("ID não encontrado");
					
		const document = await hasCompany.docs[0].ref
			.collection(this.collectionCompanyLogs)
			.orderBy("timestamp", "desc")
			.limit(10)
			.get();
		
		return document.empty? [] : document.docs.map(doc => doc.data());
	}

}

module.exports = LogsProvider;