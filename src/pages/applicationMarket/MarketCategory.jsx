/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Banner } from './Banner';
import { ApplicationList } from './ApplicationList';
import { ApplicationType } from './ApplicationType';
import { Pagination, ConfigProvider, message } from 'antd';
import '@/styles/applicationMarket/index.less';
import { useState, useEffect, useStore } from 'openinula';
import zhCN from 'antd/es/locale/zh_CN';
import { getHelmChartList } from '@/api/applicationMarketApi';
import { useLocation, useParams } from 'inula-router';
import qs from 'query-string';

const defaultPageSize = 50;
export default function MarketCategory() {
  const location = useLocation();
  const { scene, isFuyaoExtension, isCompute } = useParams();
  const [total, setTotal] = useState(0);
  const [helmChartListData, setHelmChartListData] = useState([]);
  const [chart, setChart] = useState('');
  const [sortType, setSortType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [sceneList, setSceneList] = useState(scene ? [decodeURIComponent(scene)] : []);
  const [sourceList, setSourceList] = useState([]);
  const [isComputingEngine, setIsComputingEngine] = useState(false);
  const [isSelectExtensionComponent, setIsSelectExtensionComponent] = useState('');
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const getHelmChartListData = async () => {
    let updatedSceneList = [...sceneList];
    updatedSceneList = updatedSceneList.filter(filterItem => filterItem !== 'undefined'); // 过滤undefined
    if (isComputingEngine) {
      updatedSceneList.push('compute-power-engine-plugin');
    };
    try {
      const params = {
        chart,
        sortType,
        sourceList,
        isSelectExtensionComponent,
        sceneList: updatedSceneList,
      };
      const res = await getHelmChartList(params, currentPage, limit);
      setHelmChartListData(res.data.data.items);
      setTotal(res.data.data.totalItems);
    } catch (error) {
      messageApi.error(error.response.data.msg);
    }
  };

  const handleSearchFn = async (name) => {
    if (isComputingEngine) {
      sceneList.push('compute-power-engine-plugin');
    };
    try {
      const params = {
        chart: name,
        sourceList,
        sceneList,
        isSelectExtensionComponent,
        sortType,
      };
      const res = await getHelmChartList(params, currentPage, limit);
      setTotal(res.data.data.totalItems);
      setHelmChartListData(res.data.data.items);
      setSceneList([]);
    } catch (error) {
      messageApi.error(error.response.data.msg);
    }
  };

  const handleInputChartFn = (e) => {
    setChart(e);
  };
  const handleSelectFn = (type) => {
    setSortType(type);
  };

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const handleSelectType = (list) => {
    setSceneList(list);
  };

  const handleSelectExtensionComponent = (e) => {
    setIsSelectExtensionComponent(e);
  };

  const handleSelectSource = (list) => {
    setSourceList(list);
  };

  const handleComputingEngine = (bool) => {
    setIsComputingEngine(bool);
  };
  useEffect(() => {
    getHelmChartListData();
  }, [
    chart,
    currentPage,
    limit,
    sortType,
    isSelectExtensionComponent,
    sourceList,
    isComputingEngine,
  ]);

  useEffect(() => {
    if (!sceneList.includes('null') && !sceneList.includes('undefined')) {
      getHelmChartListData();
    }
  }, [sceneList]);

  useEffect(() => {
    if (location.state?.isQuery) {
      setChart(location?.state?.isQuery);
    }
  }, [location.state?.isQuery]);
  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <Banner />
      <div style={{ display: 'flex' }}>
        <ApplicationType
          scene={decodeURIComponent(scene)}
          isFuyaoExtension={isFuyaoExtension}
          isCompute={isCompute}
          onSelectSource={handleSelectSource}
          onSelectType={handleSelectType}
          onExtensionComponent={handleSelectExtensionComponent}
          onComputingEngine={handleComputingEngine}
        />
        <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(100vw - 200px)' }}>
          <ApplicationList
            total={total}
            searchName={chart}
            helmChartListData={helmChartListData}
            getHelmChartListData={getHelmChartListData}
            onSearchFn={handleSearchFn}
            onSelectFn={handleSelectFn}
            onInputChartFn={handleInputChartFn}
          />
          < ConfigProvider locale={zhCN}>
            <Pagination
              className='page'
              showTotal={(totalNumber) => `共${totalNumber}条`}
              defaultPageSize={limit}
              showSizeChanger={false}
              showQuickJumper={true}
              total={total}
              onChange={handleChange}
            ></Pagination>
          </ConfigProvider>
        </div>
      </div>
    </div >
  );
}

