const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName, getEndDate, getStartDate } = require("./common/commons");


class ClpProvider extends FirestoreConnection {
  
  constructor(serviceAccount) {
    super(serviceAccount);
    this.companyProvider = new CompanyProvider(serviceAccount);
  }

  async index(company, pagination = { limit: 10, page: 0 }) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const doc = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.orderBy("createdAt", "desc");

		const clps = await doc
			.offset(pagination.limit * pagination.page)
			.limit(pagination.limit)
			.get();
		
		const count = (await doc.get()).size;

		return {
			count,
			list: clps.docs.map(clp => clp.data()),
		};
	}

  async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const clp = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
      .where("id", "==", id)
      .get();

		if (ref) return clp;

		if (clp.empty) return null;
				
		return clp.docs[0].data();
  }

  async save(company, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.doc(generateDocName());

		const save = {
			...data,
			id: uuidv4(),
		};
		
		await document.set(save);
		return save;
	}

  async update(company, id, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.update({
			...data,
			id: document.docs[0].data().id,
		});
	}

	async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

	async inArray(company, list, operation = "in", selectOnlyId = true) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const clps = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionClp)
      .where("id", operation, list)
      .get();
				
		return clps.empty? [] : selectOnlyId? clps.docs.map(doc => doc.data().id) : clps.docs.map(doc => {
			const data = doc.data();
			return {
				id: data.id,
				name: data.name
			}
		}); 
  }

	async saveInfos(company, id, data) {
		const clp = await this.getById(company, id, true);
		
		if (clp.empty) 
			throw new Error("ID não encontrado");

		const document = clp.docs[0].ref
			.collection(this.collectionClpInfos)
			.doc(generateDocName());
		
		const now = new Date();
		now.setHours(now.getHours() - now.getTimezoneOffset() / 60);
		
		return await document.set({ 
			data,
			timestamp: now.getTime(),
		});
	}

	async getInfos(company, id) {
		const clp = await this.getById(company, id, true);
		
		if (clp.empty) 
			throw new Error("ID não encontrado");
		
		const document = await clp.docs[0].ref
			.collection(this.collectionClpInfos)
			.orderBy("timestamp", "desc")
			.limit(1)
			.get();
		
		return document.empty? [] : document.docs.map(doc => doc.data());
	}

}

module.exports = ClpProvider;