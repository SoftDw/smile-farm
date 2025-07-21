



import React, { useState, useMemo, useEffect } from 'react';
import { Customer, SalesOrder, Crop, PermissionSet, OrderItem, FarmInfo } from '../types';
import Card from './Card';
import Modal from './Modal';
import BriefcaseIcon from './icons/BriefcaseIcon';
import { Database, Json } from '../lib/database.types';
import Invoice from './Invoice';
import PurchaseOrder from './PurchaseOrder';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type SalesOrderInsert = Database['public']['Tables']['sales_orders']['Insert'];

type ActiveTab = 'dashboard' | 'orders' | 'customers';

const InputField = ({label, value, onChange, type="text", required=false}: {label:string, value:string, onChange: (e:any)=>void, type?:string, required?:boolean}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} value={value} onChange={onChange} required={required} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
    </div>
);

interface SalesManagementProps {
    customers: Customer[];
    salesOrders: SalesOrder[];
    crops: Crop[];
    permissions: PermissionSet;
    onSaveCustomer: (customer: CustomerInsert) => Promise<void>;
    onDeleteCustomer: (customerId: number) => Promise<void>;
    onSaveSalesOrder: (order: SalesOrderInsert) => Promise<void>;
    onDeleteSalesOrder: (orderId: number) => Promise<void>;
    farmInfo: FarmInfo;
}

const SalesManagement: React.FC<SalesManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [orderToPrint, setOrderToPrint] = useState<SalesOrder | null>(null);
    const [poToPrint, setPoToPrint] = useState<SalesOrder | null>(null);

     useEffect(() => {
        if (orderToPrint) {
            const timer = setTimeout(() => {
                window.print();
                setOrderToPrint(null); // Reset after printing to hide the component
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [orderToPrint]);

    useEffect(() => {
        if (poToPrint) {
            const timer = setTimeout(() => {
                window.print();
                setPoToPrint(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [poToPrint]);


    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab 
                ? 'border-farm-green text-farm-green' 
                : 'border-transparent text-gray-500 hover:text-farm-green-dark hover:border-farm-green'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-8">
            <div className="no-print">
                <h1 className="text-4xl font-bold text-farm-green-dark mb-6 flex items-center gap-3">
                    <BriefcaseIcon className="w-9 h-9" /> การตลาดและการขาย
                </h1>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-2">
                        <TabButton tab="dashboard" label="ภาพรวม" />
                        <TabButton tab="orders" label="จัดการคำสั่งซื้อ" />
                        <TabButton tab="customers" label="จัดการลูกค้า (CRM)" />
                    </nav>
                </div>

                <div>
                    {activeTab === 'dashboard' && <SalesDashboard salesOrders={props.salesOrders} customers={props.customers} />}
                    {activeTab === 'orders' && <OrderManagementTab {...props} setOrderToPrint={setOrderToPrint} setPoToPrint={setPoToPrint} />}
                    {activeTab === 'customers' && <CustomerManagementTab {...props} />}
                </div>
            </div>
            
            <Invoice order={orderToPrint} customers={props.customers} crops={props.crops} farmInfo={props.farmInfo} />
            <PurchaseOrder order={poToPrint} customers={props.customers} crops={props.crops} farmInfo={props.farmInfo} />
        </div>
    );
};


// --- Sales Dashboard Tab ---
const SalesDashboard: React.FC<{ salesOrders: SalesOrder[], customers: Customer[] }> = ({ salesOrders, customers }) => {
    const totalRevenue = useMemo(() => salesOrders.reduce((sum, order) => sum + order.totalAmount, 0), [salesOrders]);
    const totalOrders = salesOrders.length;
    const totalCustomers = customers.length;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="ยอดขายทั้งหมด">
                <p className="text-3xl font-bold text-green-600">{totalRevenue.toLocaleString()} บาท</p>
            </Card>
            <Card title="จำนวนคำสั่งซื้อ">
                <p className="text-3xl font-bold text-blue-600">{totalOrders} รายการ</p>
            </Card>
             <Card title="ลูกค้าทั้งหมด">
                <p className="text-3xl font-bold text-purple-600">{totalCustomers} ราย</p>
            </Card>
        </div>
    );
};


const initialOrderFormData: Omit<SalesOrder, 'id' | 'totalAmount'> = {
    customerId: 0,
    orderDate: new Date().toISOString().split('T')[0],
    status: 'Quote',
    items: [],
};

// --- Order Management Tab ---
const OrderManagementTab: React.FC<SalesManagementProps & { setOrderToPrint: (order: SalesOrder) => void, setPoToPrint: (order: SalesOrder) => void }> = ({ salesOrders, onSaveSalesOrder, onDeleteSalesOrder, customers, crops, permissions, setOrderToPrint, setPoToPrint }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
    const [formData, setFormData] = useState(initialOrderFormData);

    const totalAmount = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }, [formData.items]);

    const handleOpenModal = (order: SalesOrder | null) => {
        setEditingOrder(order);
        if (order) {
            setFormData({
                customerId: order.customerId,
                orderDate: order.orderDate,
                status: order.status,
                items: JSON.parse(JSON.stringify(order.items)), // Deep copy
            });
        } else {
             setFormData({
                ...initialOrderFormData,
                customerId: customers.length > 0 ? customers[0].id : 0,
             });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId || formData.items.length === 0) {
            alert('กรุณาเลือกลูกค้าและเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
            return;
        }

        const orderToSave: SalesOrderInsert = {
            id: editingOrder?.id,
            customer_id: formData.customerId,
            order_date: formData.orderDate,
            status: formData.status,
            items: formData.items as unknown as Json,
            total_amount: totalAmount,
        };

        await onSaveSalesOrder(orderToSave);
        handleCloseModal();
    };
    
    const handleDelete = (orderId: number) => {
        if(window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อ #${orderId}?`)) {
            onDeleteSalesOrder(orderId);
        }
    }

    const handleItemChange = (itemId: string, field: keyof OrderItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => item.itemId === itemId ? { ...item, [field]: value } : item)
        }));
    };

    const handleAddItem = () => {
        if (crops.length === 0) {
            alert("ไม่มีพืชผลให้เลือก");
            return;
        }
        const newItem: OrderItem = {
            itemId: `temp-${Date.now()}`,
            cropId: crops[0].id,
            quantity: 1,
            unitPrice: 0,
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.itemId !== itemId) }));
    };

    const getCustomerName = (customerId: number) => customers.find(c => c.id === customerId)?.name || 'N/A';

    const statusColorMap = {
        'Quote': 'bg-gray-100 text-gray-800', 'Confirmed': 'bg-blue-100 text-blue-800',
        'Shipped': 'bg-yellow-100 text-yellow-800', 'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800'
    };

    return (
        <Card title="รายการคำสั่งซื้อ">
            <div className="flex justify-end mb-4">
                {permissions.create && (
                    <button onClick={() => handleOpenModal(null)} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">
                        เพิ่มคำสั่งซื้อใหม่
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Order ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">ลูกค้า</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">วันที่สั่ง</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">ยอดรวม</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">สถานะ</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {salesOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono">#{order.id}</td>
                            <td className="px-4 py-3 font-medium">{getCustomerName(order.customerId)}</td>
                            <td className="px-4 py-3">{order.orderDate}</td>
                            <td className="px-4 py-3 text-right font-semibold">{order.totalAmount.toLocaleString()} ฿</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[order.status]}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                {permissions.edit && <button onClick={() => handleOpenModal(order)} className="text-sm text-blue-600 font-medium mr-2">ดู/แก้ไข</button>}
                                {permissions.delete && <button onClick={() => handleDelete(order.id)} className="text-sm text-red-600 font-medium">ลบ</button>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingOrder ? `แก้ไขคำสั่งซื้อ #${editingOrder.id}` : 'สร้างคำสั่งซื้อใหม่'} className="max-w-4xl">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ลูกค้า</label>
                                <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: parseInt(e.target.value)})} className="mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md" required>
                                    <option value={0} disabled>-- เลือกลูกค้า --</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">วันที่สั่งซื้อ</label>
                                <input type="date" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as SalesOrder['status']})} className="mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md">
                                    {Object.keys(statusColorMap).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">รายการสินค้า</h3>
                            <div className="space-y-2">
                            {formData.items.map((item, index) => (
                                <div key={item.itemId} className="grid grid-cols-12 gap-2 items-center">
                                    <select value={item.cropId} onChange={e => handleItemChange(item.itemId, 'cropId', parseInt(e.target.value))} className="col-span-5 mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md">
                                        {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="จำนวน" value={item.quantity} onChange={e => handleItemChange(item.itemId, 'quantity', parseFloat(e.target.value) || 0)} className="col-span-2 mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                                    <input type="number" placeholder="ราคา/หน่วย" value={item.unitPrice} onChange={e => handleItemChange(item.itemId, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-3 mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                                    <div className="col-span-2 text-right">
                                        <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700">ลบ</button>
                                    </div>
                                </div>
                            ))}
                            </div>
                             <button type="button" onClick={handleAddItem} className="mt-2 text-sm text-farm-green font-semibold hover:text-farm-green-dark">+ เพิ่มรายการ</button>
                        </div>
                        
                        <div className="flex justify-between items-center border-t pt-4">
                             <h3 className="text-xl font-bold">ยอดรวม:</h3>
                             <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ฿</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                            <button
                                type="button"
                                onClick={() => { if(editingOrder) setPoToPrint(editingOrder); }}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg"
                                disabled={!editingOrder}
                            >
                                พิมพ์ใบสั่งซื้อ
                            </button>
                            <button
                                type="button"
                                onClick={() => { if(editingOrder) setOrderToPrint(editingOrder); }}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                                disabled={!editingOrder}
                            >
                                พิมพ์ใบแจ้งหนี้
                            </button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึกคำสั่งซื้อ</button>
                        </div>
                    </form>
                </Modal>
            )}

        </Card>
    );
};

// --- Customer Management Tab ---
const CustomerManagementTab: React.FC<SalesManagementProps> = ({ customers, onSaveCustomer, onDeleteCustomer, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({ name: '', contactPerson: '', phone: '', email: '', address: '' });

    const handleOpenModal = (customer: Customer | null) => {
        setEditingCustomer(customer);
        if (customer) {
            // Explicitly create a new object from the customer prop to ensure a clean state for the form.
            setFormData({
                name: customer.name,
                contactPerson: customer.contactPerson,
                phone: customer.phone,
                email: customer.email,
                address: customer.address
            });
        } else {
            setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
        }
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleDelete = (customerId: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้ารายนี้?')) {
            onDeleteCustomer(customerId);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name) return alert('กรุณาใส่ชื่อลูกค้า');

        const customerToSave: CustomerInsert = {
            id: editingCustomer?.id,
            name: formData.name,
            contact_person: formData.contactPerson || null,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
        }
        await onSaveCustomer(customerToSave);
        handleCloseModal();
    };
    
    return (
        <Card title="ทะเบียนลูกค้า (CRM)">
            <div className="flex justify-end mb-4">
            {permissions.create && (
                <button 
                  onClick={() => handleOpenModal(null)}
                  className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  เพิ่มลูกค้าใหม่
                </button>
            )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">ชื่อลูกค้า</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">ผู้ติดต่อ</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">เบอร์โทรศัพท์</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">อีเมล</th>
                            {(permissions.edit || permissions.delete) && <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {customers.map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{customer.name}</td>
                            <td className="px-4 py-3">{customer.contactPerson}</td>
                            <td className="px-4 py-3">{customer.phone}</td>
                            <td className="px-4 py-3">{customer.email}</td>
                            {(permissions.edit || permissions.delete) && (
                                <td className="px-4 py-3 text-right">
                                    {permissions.edit && <button onClick={() => handleOpenModal(customer)} className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-4">แก้ไข</button>}
                                    {permissions.delete && <button onClick={() => handleDelete(customer.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">ลบ</button>}
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"} className="max-w-2xl">
                    <form onSubmit={handleSave} className="space-y-4">
                        <InputField label="ชื่อลูกค้า/บริษัท" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                        <InputField label="ชื่อผู้ติดต่อ" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                        <InputField label="เบอร์โทรศัพท์" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        <InputField label="อีเมล" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <div>
                             <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                             <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
                        </div>
                    </form>
                 </Modal>
            )}
        </Card>
    );
};

export default SalesManagement;