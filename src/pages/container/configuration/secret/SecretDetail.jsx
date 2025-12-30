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
import { ExportOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons';
import DetailHeader from '@/pages/container/configuration/component/DetailHeader';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { Tabs, Button, message, Breadcrumb, Tag } from 'antd';
import '@/styles/pages/configuration.less';
import { useEffect, useRef, useState, useStore, useCallback } from 'openinula';
import { useParams } from 'inula-router';
import { getSecretDetails, updateSecrets, updateSecretLabelAnnotation } from '@/api/containerApi';
import { solveAnnotation, jsonToYaml } from '@/tools/utils';
import Dayjs from 'dayjs';
import { Link } from 'inula-router';
import { yamlTojson, exportYamlOutPut } from '@/tools/utils';
import copy from 'copy-to-clipboard';
import { EditOutlined } from '@ant-design/icons';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { useHistory } from 'inula-router';
import LabelTag from '@/components/LabelTag';
import BreadCrumbCom from '@/components/BreadCrumbCom';

export default function SecretDetail() {
  const themeStore = useStore('theme');
  const { secretNameSpace, secretName, activeKey } = useParams();
  const [secretData, setSecretData] = useState(null);
  const [yamlData, setYamlData] = useState('');
  const [dataInfo, setDataInfo] = useState('');
  const [secretLoading, setSecretLoading] = useState(false);
  const [secretDetailTabKey, setSecretDetailTabKey] = useState(activeKey || 'detail');
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读
  const [messageApi, contextHolder] = message.useMessage();
  // 获取详情基本信息
  const getSecretDetailsInfo = useCallback(async () => {
    if (secretNameSpace && secretName) {
      setSecretLoading(false);
      const res = await getSecretDetails(secretNameSpace, secretName);
      if (res.status === 200) {
        setYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setSecretData(res.data);
        setDataInfo(jsonToYaml(JSON.stringify(res.data?.data)));
        setSecretLoading(true);
      }
      setSecretLoading(true);
    }
  }, [secretName, secretNameSpace]);
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };
  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Details
        secretData={secretData}
        secretNameSpace={secretNameSpace}
        secretName={secretName}
        dataInfo={dataInfo}
        refreshFn={getSecretDetailsInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: (
        <YamlDetail
          yamlData={yamlData}
          onSetYamlData={setYamlData}
          secretName={secretName}
          readOnly={isReadyOnly}
          secretNameSpace={secretNameSpace}
          handleEditFn={handleReadyOnly}
          refreshFn={getSecretDetailsInfo}
        />
      ),
    },
  ];

  const handleEditFn = () => {
    setSecretDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const handleSecretDetailIndex = (key) => {
    setSecretDetailTabKey(key);
    setIsReadyOnly(true);
  };

  useEffect(() => {
    if (secretDetailTabKey === 'detail' || secretDetailTabKey === 'yaml') {
      getSecretDetailsInfo();
    }
  }, [getSecretDetailsInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return (
    <div className='child_content withBread_content SecretDetail'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom
        items={[
          { title: '配置与密钥', disabled: true },
          { title: 'Secret', path: `/${containerRouterPrefix}/configuration/secret` },
          { title: '详情' },
        ]}
      />
      {secretLoading && <DetailHeader
        secretName={secretName}
        title={secretName}
        onEdit={handleEditFn}
        secretLoading={secretLoading}
        type='secret'
        secretData={secretData}
        secretNameSpace={secretNameSpace}
        getSecretDetailsInfo={getSecretDetailsInfo}
      />}
      {secretLoading && <Tabs items={items} activeKey={secretDetailTabKey} onChange={handleSecretDetailIndex} destroyInactiveTabPane></Tabs>}
    </div>
  );
}

function YamlDetail({ secretNameSpace, secretName, yamlData, onSetYamlData, readOnly, handleEditFn, refreshFn }) {
  const history = useHistory();
  const yamlRef = useRef(null);
  const [newYaml, setNewYaml] = useState(yamlData);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const handleChangeYaml = (e) => {
    setNewYaml(e);
  };

  const exportYamlSecretDetail = () => {
    exportYamlOutPut(secretName, newYaml);
    messageApi.success('导出成功');
  };

  const handleUpdateSecretDetail = async () => {
    let yamlJsonSecretDetail = '';
    try {
      yamlJsonSecretDetail = yamlTojson(newYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      return;
    };
    try {
      const res = await updateSecrets(secretNameSpace, yamlTojson(newYaml), secretName);
      if (res.status === 200) {
        messageApi.success('修改成功');
        setTimeout(() => {
          refreshFn();
          handleEditFn(true);
        }, 1000);
      }
    } catch (error) {
      messageApi.error(error.response.data.message);
    }
  };
  const handleCopyYamlSecretDetail = () => {
    copy(newYaml);
    messageApi.success('复制成功！');
  };

  const handleResetSecretDetail = () => {
    yamlRef.current.resetCodeEditor(yamlData);
    setNewYaml(yamlData);
  };

  const handleCodeCancelSecretDetail = () => {
    setNewYaml(yamlData);
    handleEditFn(true);
  };
  return (
    <div>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='tab_container SecretDetailClass'>
        <div className='yaml_card'>
          <div className='yaml_flex_box SecretDetailClass'>
            {readOnly ? <div style={{ display: 'flex', gap: '8px' }}><h3>YAML</h3><EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /></div> : <h3>YAML</h3>}
            <div className='yaml_tools'>
              <div className='tool_word_group' onClick={exportYamlSecretDetail}>
                <ExportOutlined className='common_antd_icon primary_color' />
                <span>导出</span>
              </div>
              <div className='tool_word_group' onClick={handleCopyYamlSecretDetail}>
                <CopyOutlined className='common_antd_icon primary_color' />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 32px' }}>
          <CodeMirrorEditor
            yamlData={yamlData}
            ref={yamlRef}
            isEdit={!readOnly}
            changeYaml={handleChangeYaml}
          />
          {!readOnly && <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '20px',
              justifyContent: 'flex-end',
            }}
          >
            <Button className='cancel_btn' onClick={handleCodeCancelSecretDetail}>取消</Button>
            <Button className='cancel_btn' onClick={handleResetSecretDetail}>重置</Button>
            <Button className='primary_btn' onClick={handleUpdateSecretDetail}>确定</Button>
          </div>
          }
        </div>
      </div>
    </div>
  );
}

function Details({ dataInfo, secretNameSpace, secretName, refreshFn, secretData }) {
  const childCodeMirrorRef = useRef(null);
  const [oldAnnotations, setOldAnnotataions] = useState(secretData.metadata.annotations); // 未修改前注解
  const [oldLabels, setOldLabels] = useState(secretData.metadata.labels);
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isSecretLabelModalOpen, setIsSecretLabelModalOpen] = useState(false);
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  // 标签成功回调
  const handleLabelOkSecretDetail = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      // SecretDetail判断标签是否修改
      setIsSecretLabelModalOpen(false);
      return;
    }
    const keyArrSecretDetailLable = [];
    data.map(item => keyArrSecretDetailLable.push(item.key));
    if (keyArrSecretDetailLable.filter((item, index) => keyArrSecretDetailLable.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的标签
      const addLabelListSecretDetail = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
      try {
        await updateSecretLabelAnnotation(secretNameSpace, addLabelListSecretDetail, secretName);
        messageApi.success('编辑标签成功');
        setTimeout(() => {
          refreshFn();
          setIsSecretLabelModalOpen(false);
        }, 1000);
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`编辑标签失败！${error.response?.data.message}`);
        }
      };
    };
  };

  // 标签失败回调
  const handleLabelCancelSecretDetail = () => {
    setIsSecretLabelModalOpen(false);
  };

  // 注解成功回调
  const handleAnnotationOkSecretDetail = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
      return;
    }
    const keyArrSecretDetailAnnotation = [];
    data.map(item => keyArrSecretDetailAnnotation.push(item.key));
    if (keyArrSecretDetailAnnotation.filter((item, index) => keyArrSecretDetailAnnotation.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的注解
      const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
      try {
        const res = await updateSecretLabelAnnotation(secretNameSpace, addAnnotationList, secretName);
        messageApi.success('编辑注解成功');
        setTimeout(() => {
          refreshFn(); // 先刷新防止页面抖动
          setIsAnnotationModalOpen(false);
        }, 1000);
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`编辑注解失败！${error.response?.data.message}`);
        }
      };
    };
  };
  // SecretDetail 注解失败回调
  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  return (
    <div className='tab_container container_margin_box normal_container_height SecretDetail'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='detail_card' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <h3>基本信息</h3>
        <div className='detail_info_box SecretDetail'>
          <div className='base_info_list'>
            <div className='flex_item_opt SecretDetail'>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>Secret名称：</p>
                <p className='base_value'>
                  {secretData?.metadata?.name}
                </p>
              </div>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>命名空间：</p>
                <p className='base_value'>
                  {secretData?.metadata?.namespace}
                </p>
              </div>
              <div className='base_description'>
                <p className='base_key' style={{ color: '#89939b' }}>创建时间：</p>
                <p className='base_value'>
                  {Dayjs(secretData?.metadata?.creationTimestamp).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className='annotation SecretDetail'>
            <div className='ann_title'>
              <p>标签：</p>
              <EditOutlined className='primary_icon common_antd_icon SecretDetail' onClick={() => setIsSecretLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isSecretLabelModalOpen} type='label' dataList={secretData?.metadata?.labels} callbackOk={handleLabelOkSecretDetail} callbackCancel={handleLabelCancelSecretDetail} />
            <div className='key_value'>
              {secretData.metadata?.labels?.length ?
                secretData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={secretData?.metadata?.annotations} callbackOk={handleAnnotationOkSecretDetail} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {secretData.metadata?.annotations?.length ?
                secretData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
        <h3>数据</h3>
        <div className='detail_info_box'>
          {dataInfo && (
            <CodeMirrorEditor ref={childCodeMirrorRef} yamlData={dataInfo} isEdit={false} className='secret' />
          )}
        </div>
      </div>
    </div>
  );
}
