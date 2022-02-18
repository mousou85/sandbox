<template>
  <div>
    <div>
      <input type="text" id="addCompanyName" maxlength="20" placeholder="기업명 입력">
      <button type="button" @click="addCompany">추가</button>
    </div>
    <table id="companyList">
      <thead>
        <tr>
          <th>IDX</th>
          <th>기업명</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companyList" :key="company.company_idx">
          <td class="center">{{company.company_idx}}</td>
          <td>
            <input type="text" maxlength="20" :value="company.company_name"  @blur="updateCompany(company.company_idx, $event.target.value)">
            <button type="button" @click="deleteCompany(company.company_idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script  setup>
import {onMounted, ref} from "vue";
import http from '../../libs/http';

const companyList = ref([]);

onMounted(async () => {
  companyList.value = await getCompanyList();
});

const addCompany = async() => {
  const $companyName = document.getElementById('addCompanyName');
  if ($companyName) {
    if (!$companyName.value.length) {
      alert('기업명을 입력해주세요.');
      $companyName.focus();
      return false;
    }

    try {
      const res = await http.post('http://localhost:5000/invest-history/company', {company_name: $companyName.value});
      if (!res.result) throw new Error(res.resultMessage);

      $companyName.value = '';

      companyList.value = await getCompanyList();
    } catch (err) {
      alert(err);
    }
  }
}

const getCompanyList = async () => {
  try {
    const res = await http.get('http://localhost:5000/invest-history/company');
    if (!res.result) throw new Error(res.resultMessage);

    return res.data.list;
  } catch (err) {
    alert(err);
  }
}

const updateCompany = async (companyIdx, companyName) => {
  try {
    const res = await http.put(`http://localhost:5000/invest-history/company/${companyIdx}`, {company_name: companyName});
    if (!res.result) throw new Error(res.resultMessage);
  } catch (err) {
    alert(err);
  }
}

const deleteCompany = async (companyIdx) => {
  try {
    const res = await http.delete(`http://localhost:5000/invest-history/company/${companyIdx}`);
    if (!res.result) throw new Error(res.resultMessage);

    for (let key in companyList.value) {
      const item = companyList.value[key];
      if (item.company_idx == companyIdx) {
        companyList.value.splice(parseInt(key), 1);
      }
    }
  } catch (err) {
    alert(err);
  }
}
</script>

<style>
#companyList {
  border: 1px solid;
  border-collapse: collapse;
}
#companyList th, #companyList td {
  border: 1px solid;
  padding: 5px;
}
#companyList .center {
  text-align: center;
}
</style>