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
import { Tabs, Button, message, Breadcrumb, Tag } from 'antd';
import '@/styles/pages/configuration.less';
import { useEffect, useRef, useState, useStore, useCallback } from 'openinula';
import { useParams, Link } from 'inula-router';
import { getConfigMapsDetails, updateConfigMaps } from '@/api/containerApi';
import { solveAnnotation, jsonToYaml, exportYamlOutPut } from '@/tools/utils';
import { yamlTojson, forbiddenMsg } from '@/tools/utils';
import { useHistory } from 'inula-router';
import {
  ExportOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import '@/styles/pages/nodeManage.less';
import copy from 'copy-to-clipboard';
import { updateConfigMapsLabelAnnotation } from '@/api/containerApi';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotationOrLabelDiff } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';

export default function ConfigurationUpdate() {
  const { configurationNameSpace, configurationName, activeKey } = useParams();
  const [configurationData, setConfigurationData] = useState(null);
  const [yamlData, setYamlData] = useState('');
  const [dataInfo, setDataInfo] = useState('');
  const [configurationUpdateLoading, setConfigurationUpdateLoading] = useState(false);
  const [configurationDetailTabKey, setConfigurationDetailTabKey] = useState(activeKey || 'detail');
  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解
  const [oldLabels, setOldLabels] = useState([]);
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const getConfigMapsDetailsInfo = useCallback(async () => {
    if (configurationNameSpace && configurationName) {
      setConfigurationUpdateLoading(false);
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
      setConfigurationUpdateLoading(true);
    }
  }, [configurationName, configurationNameSpace]);

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };
  const items = [
    {
      key: 'detail',
      label: '详情',
      children: (
        <Details
          configurationData={configurationData}
          configurationNameSpace={configurationNameSpace}
          dataInfo={dataInfo}
          configurationName={configurationName}
          refreshFn={getConfigMapsDetailsInfo} />
      ),
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: (
        <YamlDetail
          yamlData={yamlData}
          onSetYamlData={setYamlData}
          handleEditFn={handleReadyOnly}
          configurationNameSpace={configurationNameSpace}
          configurationName={configurationName}
          readOnly={isReadyOnly}
        />
      ),
    },
  ];

  const handleChangeConfigurationIndex = (key) => {
    setConfigurationDetailTabKey(key);
  };
  const handleEditYaml = () => {
    setConfigurationDetailTabKey('yaml');
  };

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
    <div className='configmap child_content withBread_content ConfigurationUpdate'>
      {contextHolder}
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      </div>
      <BreadCrumbCom
        items={[
          { title: '配置与密钥', key: 'configuration', disabled: true },
          { title: 'ConfigMap', path: `/${containerRouterPrefix}/configuration/configMap` },
          { title: '详情' },
        ]}
      />
      {configurationUpdateLoading && <DetailHeader
        type='configMap'
        configurationLoading={configurationUpdateLoading}
        configurationData={configurationData}
        configurationNameSpace={configurationNameSpace}
        configurationName={configurationName}
        title={configurationName}
        onEdit={handleEditYaml}
        getConfigMapsDetailsInfo={getConfigMapsDetailsInfo}
      />}
      {configurationUpdateLoading &&
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
  configurationNameSpace,
  configurationName,
  yamlData,
  readOnly,
  handleEditFn,
  onSetYamlData,
}) {
  const history = useHistory();
  const yamlRef = useRef(null);
  const [newYaml, setNewYaml] = useState(yamlData);
  const [messageApi, contextHolder] = message.useMessage();
  const handleUpdate = async () => {
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(newYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      return;
    };
    try {
      const res = await updateConfigMaps(configurationNameSpace, yamlTojson(newYaml), configurationName);
      await handleEditFn(true);
      messageApi.success('修改成功');
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(error.response.data.message);
      }
    };
  };

  const handleChangeYaml = (e) => {
    setNewYaml(e);
  };

  const exportYaml = () => {
    exportYamlOutPut(configurationName, newYaml);
    messageApi.success('导出成功');
  };
  const handleCopyYaml = () => {
    copy(newYaml);
    messageApi.success('复制成功！');
  };

  const handleReset = () => {
    setNewYaml(yamlData);
    yamlRef.current.resetCodeEditor(yamlData);
  };

  const handleCodeCancel = () => {
    setNewYaml(yamlData);
    handleEditFn(true);
  };
  return (
    <div>
      <div className='tab_container ConfigurationUpdateClass'>
        {contextHolder}
        <div className='yaml_card'>
          <div className='yaml_flex_box ConfigurationUpdateClass'>
            {readOnly ? <div style={{ display: 'flex', gap: '8px' }}><h3>YAML</h3><EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /></div> : <h3>YAML</h3>}
            <div className='yaml_tools'>
              <div className='tool_word_group' onClick={exportYaml}>
                <ExportOutlined className='common_antd_icon primary_color' />
                <span>导出</span>
              </div>
              <div className='tool_word_group' onClick={handleCopyYaml}>
                <CopyOutlined className='common_antd_icon primary_color' />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 32px' }}>
          <CodeMirrorEditor
            isEdit={!readOnly}
            yamlData={newYaml}
            changeYaml={handleChangeYaml}
            ref={yamlRef}
          />
          {!readOnly &&
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                marginTop: '20px',
              }}
            >
              <Button className='cancel_btn' onClick={handleCodeCancel}>取消</Button>
              <Button className='cancel_btn' onClick={handleReset}>重置</Button>
              <Button className='primary_btn' onClick={handleUpdate}>确定</Button>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function Details({ dataInfo, configurationNameSpace, configurationName, refreshFn, configurationData }) {
  const themeStore = useStore('theme');
  const childCodeMirrorRef = useRef(null);
  const [oldAnnotations, setOldAnnotataions] = useState(configurationData.metadata.annotations); // 未修改前注解
  const [oldLabels, setOldLabels] = useState(configurationData.metadata.labels);
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isUpdateLabelModalOpen, setIsUpdateLabelModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  // 标签成功回调
  const handleLabelOkConfigurationUpdate = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsUpdateLabelModalOpen(false);
      return;
    }
    const keyArrUpdateLabel = [];
    // 判断是否存在相同key
    data.map(item => keyArrUpdateLabel.push(item.key));
    if (keyArrUpdateLabel.filter((item, index) => keyArrUpdateLabel.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      //  请求接口添加
      //  比较前后是否一致 返回处理后的标签
      const addLabelListUpdate = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
      try {
        await updateConfigMapsLabelAnnotation(configurationNameSpace, addLabelListUpdate, configurationName);
        messageApi.success('编辑标签成功');
        setTimeout(() => {
          refreshFn();
          setIsUpdateLabelModalOpen(false);
        }, 1000);
      } catch (configUpdateError) {
        if (configUpdateError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, configUpdateError);
        } else {
          messageApi.error(`编辑标签失败！${configUpdateError.response.data.message}`);
        }
      };
    };
  };

  // 注解成功回调
  const handleAnnotationOkUpdate = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
      return;
    };
    const keyArrUpdateAnnotation = [];
    data.map(item => keyArrUpdateAnnotation.push(item.key));
    if (keyArrUpdateAnnotation.filter((item, index) => keyArrUpdateAnnotation.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的注解
      const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
      try {
        const res = await updateConfigMapsLabelAnnotation(configurationNameSpace, addAnnotationList, configurationName);
        messageApi.success('编辑注解成功');
        setTimeout(() => {
          refreshFn(); // 先刷新防止页面抖动
          setIsAnnotationModalOpen(false);
        }, 1000);
      } catch (configUpdateError) {
        if (configUpdateError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, configUpdateError);
        } else {
          messageApi.error(`编辑注解失败！${configUpdateError.response.data.message}`);
        }
      };
    };
  };
  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };
  // 标签失败回调
  const handleLabelCancelUpdate = () => {
    setIsUpdateLabelModalOpen(false);
  };

  return (
    <div className='detail_info ConfigurationUpdate' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34' }}>
      {contextHolder}
      <div>
        <div className='fz_16 fw_bold' style={{ marginBottom: '32px' }}>
          基本信息
        </div>
        <div className='basic_info ConfigurationUpdate'>
          <div className='basic_info_title'>ConfigMap名称</div>
          <div className='basic_info_value'>
            {configurationData?.metadata?.name}
          </div>
        </div>
        <div className='basic_info'>
          <div className='basic_info_title'>命名空间</div>
          <div className='basic_info_value'>
            {configurationData?.metadata?.namespace}
          </div>
        </div>
        <div className='basic_info'>
          <div className='basic_info_title'>创建时间</div>
          <div className='basic_info_value'>
            {configurationData?.metadata?.creationTimestamp}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ color: '#89939b' }}>标签:</div>
          <EditOutlined className='primary_icon common_antd_icon' onClick={() => setIsUpdateLabelModalOpen(true)} />
        </div>
        <AnnotationModal open={isUpdateLabelModalOpen} type='label' dataList={configurationData?.metadata?.labels} callbackOk={handleLabelOkConfigurationUpdate} callbackCancel={handleLabelCancelUpdate} />
        <div className='key_value' style={{ marginBottom: '16px' }}>
          {configurationData?.metadata?.labels?.length ? configurationData?.metadata?.labels?.map(item => {
            return <div className='label_item ConfigurationUpdate'>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'} className='label_tag_key'>{item.key}</Tag>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#444444'} className='label_tag_value'>{item.value}</Tag>
            </div>;
          }) : <span style={{ marginTop: '13px' }}>0个</span>}
        </div>
        <div className='ConfigurationUpdate' style={{ display: 'flex', gap: '8px' }}>
          <div style={{ color: '#89939b' }}>注解:</div>
          <EditOutlined className='primary_icon common_antd_icon ConfigurationUpdate' onClick={() => setIsAnnotationModalOpen(true)} />
        </div>
        <AnnotationModal open={isAnnotationModalOpen} type='annotation' dataList={configurationData?.metadata?.annotations} callbackOk={handleAnnotationOkUpdate} callbackCancel={handleAnnotationCancel} />
        <div className='key_value' style={{ marginBottom: '16px' }}>
          {configurationData?.metadata?.annotations?.length ? configurationData?.metadata?.annotations?.map(item => {
            return <div className='label_item ConfigurationUpdate'>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'} className='label_tag_key'>{item.key}</Tag>
              <Tag color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#444444'} className='label_tag_value'>{item.value}</Tag>
            </div>;
          }) : <span style={{ marginTop: '13px' }}>0个</span>}
        </div>
      </div>
      <div>
        <div className='fz_16 fw_bold ConfigurationUpdate' style={{ marginBottom: '32px' }}>
          数据
        </div>
        {dataInfo && (
          <CodeMirrorEditor ref={childCodeMirrorRef} yamlData={dataInfo} />
        )}
      </div>
    </div>
  );
}
