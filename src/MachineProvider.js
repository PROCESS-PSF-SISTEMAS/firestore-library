const { v4:uuidv4 } = require("uuid");
const CompanyProvider = require("./CompanyProvider.js");
const FirestoreConnection = require("./connection/FirestoreConnection");
const { generateDocName } = require("./common/commons");


class MachineProvider extends FirestoreConnection {

  constructor(serviceAccount) {
		super(serviceAccount);
		this.companyProvider = new CompanyProvider(serviceAccount);
  }

  async index(company, pagination = { limit: 10, page: 0 }) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const doc = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.orderBy("createdAt", "desc");
		
		const machines = await doc
			.offset(pagination.limit * pagination.page)
			.limit(pagination.limit)
			.get();

		const count = (await doc.get()).size;

		return {
			count,
			list: machines.docs.map(machine => machine.data()),
		};
	}

  async getById(company, id, ref=false) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machine = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("id", "==", id)
      .get();

		if (ref) return machine;
				
		return machine.empty ? null : machine.docs[0].data();
  }

	async getByClpList(company, list) {
		const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machines = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("idClp", "in", list)
      .get();
				
		return machines.empty ? null : machines.docs.map(doc => doc.data());
	}

	async machinesInArray(company, list) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machines = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("id", "in", list)
      .get();
				
		return machines.empty? [] : machines.docs.map(doc => {
			const data = doc.data();
			if (!data.clpId) return data.id;
		}); 
  }

	async inArray(company, list, operation = "in", selectOnlyId = true) {
    const hasCompany = await this.companyProvider.getById(company, true);

		if (hasCompany.empty)
			throw new Error("Empresa não encontrada");
	
		const machines = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
      .where("id", operation, list)
      .get();
				
		return machines.empty? [] : selectOnlyId? machines.docs.map(doc => doc.data().id) : machines.docs.map(doc => {
			const data = doc.data();
			return {
				id: data.id,
				name: data.name
			}
		}); 
  }

  async save(company, data) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
				
		const document = this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.doc(generateDocName());
		
		const save = {
			...data,
			id: uuidv4(),
		};

		await document.set(save);
		return save;
	}

  async update(company, id, data) {
		const machine = await this.getById(company, id, true);

		if (machine.empty) 
			throw new Error("ID não encontrado");

		await machine.docs[0].ref.update({
			...data,
			id: machine.docs[0].data().id,
		});
	}

  async delete(company, id) {
		const hasCompany = await this.companyProvider.getById(company, true);
		
		if (hasCompany.empty) 
			throw new Error("Empresa não cadastrada");
		
		const document = await this.db
			.collection(this.collectionCompany)
			.doc(hasCompany.docs[0].ref.path.split('/')[1])
			.collection(this.collectionMachine)
			.where("id", "==", id)
			.get();

		if (document.empty) 
			throw new Error("ID não encontrado");

		await document.docs[0].ref.delete();
	}

}

module.exports = MachineProvider;