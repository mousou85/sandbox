<template>
  <div>
    <button type="button" @click="getCompanyList">1234</button>
    <table id="companyList">
      <thead>
        <tr>
          <th>IDX</th>
          <th>기업명</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companyList" :key="company.company_idx">
          <td class="center">{{company.company_idx}}</td>
          <td>{{company.company_name}}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script  setup>
import axios from 'axios';
import {onMounted, ref} from "vue";

const companyList = ref([]);

onMounted(async () => {
  companyList.value = await getCompanyList();
});

const getCompanyList = async () => {
  try {
    const res = await axios.get('http://localhost:5000/invest-history/company');
    const json = res.data;
    if (!json.result) throw new Error(json.resultMessage);
    return json.data.list;
  } catch (err) {
    const errMessage = err.response?.data?.error || err.message;
    alert(errMessage);
    return [];
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