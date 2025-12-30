/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import DetailHeader from '@/pages/container/configuration/component/DetailHeader';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { Tabs, Button, message, Tag } from 'antd';
import '@/styles/pages/configuration.less';
import { useEffect, useRef, useState, useStore, useCallback } from 'openinula';
import { useHistory, useParams, Link } from 'inula-router';
import { getConfigMapsDetails, updateConfigMaps, updateConfigMapsLabelAnnotation } from '@/api/containerApi';
import { solveAnnotation, jsonToYaml } from '@/tools/utils';
import Dayjs from 'dayjs';
import {
  ExportOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import '@/styles/pages/nodeManage.less';
import { Breadcrumb } from 'antd';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import copy from 'copy-to-clipboard';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotationOrLabelDiff } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { ResponseCode } from '@/common/constants';

export default function ConfigurationDetail() {
  const history = useHistory();
  const themeStore = useStore('theme');
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const { configurationNameSpace, configurationName, activeKey } = useParams();
  const [configurationData, setConfigurationData] = useState(null);
  const [yamlData, setYamlData] = useState('');
  const [dataInfo, setDataInfo] = useState('');
  const [configurationDetailTabKey, setConfigurationDetailTabKey] = useState(activeKey || 'detail');
  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读
  const [oldLabels, setOldLabels] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const getConfigMapsDetailsInfo = useCallback(async () => {
    if (configurationNameSpace && configurationName) {
      setConfigurationLoading(false);
      const res = await getConfigMapsDetails(configurationNameSpace, configurationName);
      if (res.status === 200) {
        setYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setConfigurationData(res.data);
        setDataInfo(jsonToYaml(JSON.stringify(res.data?.data)));
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
      }
      setConfigurationLoading(true);
    }
  }, [configurationName, configurationNameSpace]);

  const handleChangeConfigurationIndex = (key) => {
    setConfigurationDetailTabKey(key);
    setIsReadyOnly(true);
  };

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleEditFn = () => {
    setConfigurationDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const items = [
    {
      label: '详情',
      key: 'detail',
      children: (
        <Details
          configurationName={configurationName}
          configurationData={configurationData}
          dataInfo={dataInfo}
          configurationNameSpace={configurationNameSpace}
          refreshFn={getConfigMapsDetailsInfo} />
      ),
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: (
        <YamlDetail
          onSetYamlData={setYamlData}
          yamlData={yamlData}
          readOnly={isReadyOnly}
          handleEditFn={handleReadyOnly}
          configurationName={configurationName}
          configurationNameSpace={configurationNameSpace}
        />
      ),
    },
  ];

  useEffect(() => {
    if (configurationDetailTabKey === 'detail' || configurationDetailTabKey === 'yaml') {
      getConfigMapsDetailsInfo();
    }
  }, [getConfigMapsDetailsInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return (
    <div className='configmap child_content withBread_content ConfigurationDetail'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom
        items={[
          { title: '配置与密钥', disabled: true },
          { title: 'ConfigMap', path: `/${containerRouterPrefix}/configuration/configMap` },
          { title: '详情' },
        ]}
      />
      {configurationLoading && <DetailHeader
        type='configMap'
        configurationName={configurationName}
        title={configurationName}
        configurationLoading={configurationLoading}
        configurationData={configurationData}
        configurationNameSpace={configurationNameSpace}
        getConfigMapsDetailsInfo={getConfigMapsDetailsInfo}
        onEdit={handleEditFn}
      />}
      {configurationLoading &&
        <Tabs
          items={items}
          onChange={handleChangeConfigurationIndex}
          activeKey={configurationDetailTabKey}
          destroyInactiveTabPane>
        </Tabs>}
    </div>
  );
}

function YamlDetail({
  configurationName,
  configurationNameSpace,
  readOnly,
  yamlData,
  handleEditFn,
  onSetYamlData,
}) {
  const yamlRef = useRef(null);
  const history = useHistory();
  const [newYaml, setNewYaml] = useState(yamlData);
  const [messageApi, contextHolder] = message.useMessage();
  const handleUpdateConfigurationDetail = async () => {
    let yamlJsonConfigurationDetail = '';
    try {
      yamlJsonConfigurationDetail = yamlTojson(newYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      return;
    };
    try {
      const res = await updateConfigMaps(
        configurationNameSpace,
        yamlJsonConfigurationDetail,
        configurationName
      );
      if (res.status === ResponseCode.OK) {
        await handleEditFn(true);
        messageApi.success('修改成功');
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`修改失败！${error.response.data.message}`);
      }
    }
  };

  const handleChangeYaml = (e) => {
    setNewYaml(e);
  };

  const exportYamlConfigurationDetail = () => {
    exportYamlOutPut(configurationName, newYaml);
    messageApi.success('导出成功');
  };
  const handleCopyYamlConfigurationDetail = () => {
    copy(newYaml);
    messageApi.success('复制成功！');
  };

  const handleResetConfigurationDetail = () => {
    yamlRef.current.resetCodeEditor(yamlData);
    setNewYaml(yamlData);
  };

  const handleCodeCancelConfigurationDetail = () => {
    setNewYaml(yamlData);
    handleEditFn(true);
  };
  return (
    <div>
      {contextHolder}
      <div className='tab_container ConfigurationDetailClass'>
        <div className='yaml_card'>
          <div className='yaml_flex_box ConfigurationDetailClass'>
            {readOnly ? <div style={{ display: 'flex', gap: '8px' }}><h3>YAML</h3><EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /></div> : <h3>YAML</h3>}
            <div className='yaml_tools'>
              <div className='tool_word_group configurationDetailExport' onClick={exportYamlConfigurationDetail}>
                <ExportOutlined className='common_antd_icon primary_color' />
                <span>导出</span>
              </div>
              <div className='tool_word_group configurationDetailCopy' onClick={handleCopyYamlConfigurationDetail}>
                <CopyOutlined className='common_antd_icon primary_color' />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <div className='ConfigurationDetailClass' style={{ padding: '0 32px' }}>
          <CodeMirrorEditor
            ref={yamlRef}
            isEdit={!readOnly}
            yamlData={newYaml}
            changeYaml={handleChangeYaml}
          />
          {
            !readOnly && <div style={{ display: 'flex', marginTop: '20px', gap: '16px', justifyContent: 'flex-end' }}>
              <Button className='cancel_btn' onClick={handleCodeCancelConfigurationDetail}>
                取消
              </Button>
              <Button className='cancel_btn' onClick={handleResetConfigurationDetail}>
                重置
              </Button>
              <Button className='primary_btn' onClick={handleUpdateConfigurationDetail}>
                确定
              </Button>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function Details({ configurationData, configurationNameSpace, dataInfo, configurationName, refreshFn }) {
  const childCodeMirrorRef = useRef(null);
  const [oldAnnotations, setOldAnnotataions] = useState(configurationData.metadata.annotations); // 未修改前注解
  const [oldLabels, setOldLabels] = useState(configurationData.metadata.labels);
  const themeStore = useStore('theme');
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  // 标签成功回调
  const handleLabelOkConfigurationDetail = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
      return;
    }
    const keyArrDetailLabel = [];
    // 判断是否存在相同key
    data.map(item => keyArrDetailLabel.push(item.key));
    if (keyArrDetailLabel.filter((item, index) => keyArrDetailLabel.indexOf(item) !== index).length) {
      message.error('存在相同key!');
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的标签
      const addLabelListDetail = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
      try {
        await updateConfigMapsLabelAnnotation(configurationNameSpace, addLabelListDetail, configurationName);
        message.success('编辑标签成功');
        setTimeout(() => {
          refreshFn();
          setIsLabelModalOpen(false);
        }, 1000);
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`编辑标签失败！${error.response.data.message}`);
        }
      };
    };
  };

  // 注解成功回调
  const handleAnnotationOkDetail = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      message.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
      return;
    };
    const keyArrDetailAnnotation = [];
    data.map(item => keyArrDetailAnnotation.push(item.key));
    if (keyArrDetailAnnotation.filter((item, index) => keyArrDetailAnnotation.indexOf(item) !== index).length) {
      message.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的注解
      const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
      try {
        const res = await updateConfigMapsLabelAnnotation(configurationNameSpace, addAnnotationList, configurationName);
        message.success('编辑注解成功');
        setTimeout(() => {
          refreshFn(); // 先刷新防止页面抖动
          setIsAnnotationModalOpen(false);
        }, 1000);
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`编辑注解失败！${error.response.data.message}`);
        }
      };
    };
  };

  // 标签失败回调
  const handleLabelCancelDetail = () => {
    setIsLabelModalOpen(false);
  };

  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  return (
    <div className='tab_container container_margin_box normal_container_height ConfigurationDetail'>
      {contextHolder}
      <div className='detail_card' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <h3>基本信息</h3>
        <div className='detail_info_box ConfigurationDetail'>
          <div className='base_info_list'>
            <div className='flex_item_opt ConfigurationDetail'>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>ConfigMap名称：</p>
                <p className='base_value'>
                  {configurationData?.metadata?.name}
                </p>
              </div>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>命名空间：</p>
                <p className='base_value'>
                  {configurationData?.metadata?.namespace}
                </p>
              </div>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>创建时间：</p>
                <p className='base_value'>
                  {Dayjs(configurationData?.metadata?.creationTimestamp).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className='annotation ConfigurationDetail'>
            <div className='ann_title'>
              <p>标签：</p>
              <EditOutlined className='primary_icon common_antd_icon ConfigurationDetail' onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type='label' dataList={configurationData?.metadata?.labels} callbackOk={handleLabelOkConfigurationDetail} callbackCancel={handleLabelCancelDetail} />
            <div className='key_value'>
              {configurationData.metadata?.labels?.length ?
                configurationData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={configurationData?.metadata?.annotations} callbackOk={handleAnnotationOkDetail} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {configurationData.metadata?.annotations?.length ?
                configurationData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
        <h3>数据</h3>
        <div className='detail_info_box'>
          {dataInfo && (
            <CodeMirrorEditor ref={childCodeMirrorRef} yamlData={dataInfo} isEdit={false} />
          )}
        </div>
      </div>
    </div>
  );
}
