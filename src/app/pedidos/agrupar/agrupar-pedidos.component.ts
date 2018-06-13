import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-style';
import { saveAs } from 'file-saver';
import { NgxStepperComponent, StepperOptions } from 'ngx-stepper';
import { LocalDataSource } from 'ng2-smart-table';

import { DataService } from '../../services/data.service';
import { StockService } from '../../services/stock.service';
import { Subscription } from 'rxjs/Subscription';

type AOA = any[][];

@Component({
  selector: 'app-agrupar-pedidos',
  templateUrl: './agrupar-pedidos.component.html',
  styleUrls: ['./agrupar-pedidos.component.scss']
})
export class AgruparPedidosComponent implements OnInit, OnDestroy {

  // Properties DataTableExport
  private columnsExport: Object = {
    codProducto:  { title: 'Cod. Producto', editable: false },
    descripcion:  { title: 'Descripcion', editable: false },
    cantPedida:   { title: 'Cant. Pedida', editable: true },
    unidadMedida: { title: 'Unidad de Medida', editable: false },
    cantReal:     { title: 'Cant. Real', editable: false },
    kgReales:     { title: 'Kg. Reales', editable: false },
    kgPedidos:    { title: 'Kg. Pedidos', editable: false },
    lote:         { title: 'Lote', editable: false }
  };
  public settingsTableExport = {
    attr: { class: 'table' },
    actions: false,
    hideSubHeader: true,
    columns: this.columnsExport,
    pager: { display: false }
  };
  public sourceDataTableExport: LocalDataSource;

  // Properties DataTable
  private columns: Object = {
    codProducto:   { title: 'Cod. Producto', editable: false },
    descripcion:   { title: 'Descripcion', editable: false },
    cantPedida:    { title: 'Cant. Pedida', editable: false },
    multiplicador: { title: 'Multiplicador', editable: false },
    stockActual:   { title: 'Stock Actual', editable: false },
    cantAPedir:    { title: 'Cant. a Pedir', editable: true },
    unidadMedida:  { title: 'Unidad de Medida', editable: false },
    kgUnitario:     { title: 'Kg. Unitario', editable: false },
  };
  public settingsTable = {
    attr: { class: 'table' },
    actions: { delete: false },
    hideSubHeader: true,
    columns: this.columns,
    edit: { confirmSave: true },
    pager: { display: false }
  };
  public sourceDataTable: LocalDataSource;

  // Properties InputFile Pedidos
  public inputFileModel: Array<any> = new Array<any>();
  public inputMaxFiles: number = 40;
  public inputAccept: string = '.xls,.xlsx';
  private internalFileModel: Array<any> = new Array<any>(); // I need for disconetion of model when remove all files
  private internalFileErrors: Array<any> = new Array<any>();
  private fileName = 'PedidoAgrupado.xlsx';

  // Properties Stepper
  @ViewChild('stepperDemo')
  public steppers: NgxStepperComponent;
  public optionsStepper: StepperOptions = {
    vertical: false,
    linear: true,
    alternative: true,
    mobileStepText: false,
    enableSvgIcon: true,
    labelStep: 'Paso',
    labelOf: 'de'
  };

  // Indices columnas Excel
  private coColProductoId = 0;
  private coColDescripcion = 1;
  private coColCantPedida = 2;
  private coColUnidadMedida = 3;
  private coColKgPedidos = 6;

  // Owner Properties
  public usuario: {
    depositoId: number;
    deposito: string;
    cantFilesLoad: number
  } = {
    depositoId: -1,
    deposito: '',
    cantFilesLoad: -1
  };
  public proveedores: any[];
  public proveedorSel: any;
  public stock: any[];

  public usuarioLoaded: boolean;
  public proveedoresLoaded: boolean;
  public subs: Subscription[] = [];

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private dataService: DataService,
              private stockService: StockService) {
  }

  public ngOnInit(): void {
    this._iconRegistry
      .addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/done.svg'));
    this._iconRegistry
      .addSvgIcon('step-warning', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/warning.svg'));

    this.subs.push( this.dataService.valueDatosUsuario.asObservable().subscribe( usuario => {
      this.usuarioLoaded = !!usuario;
      if (this.usuarioLoaded) {
        this.usuario.depositoId = usuario.depositoId;
        this.usuario.cantFilesLoad = usuario.cantFilesLoad;
        this.usuario.deposito = usuario.deposito;

        this.stockService
          .getStock(this.usuario.depositoId)
          .then((stock: any[]) => {
            this.stock = stock;
          });
      }
    }));

    this.subs.push( this.dataService.valueProveedores.asObservable().subscribe( proveedores => {
      this.proveedoresLoaded = !!proveedores;
      if (this.proveedoresLoaded) {
        this.proveedores = proveedores;
        this.SelectProveedor(this.proveedores[0]);
      }
    }));


  }

  public ngOnDestroy() {
    this.subs.forEach( sub => {
      if ( sub && sub.unsubscribe ) {
        sub.unsubscribe();
      }
    });
    this.subs.slice(0, this.subs.length);
  }

  // metodos para el manejo de datos
  private readMultipleFiles = (files) => {
    let detalle: AOA;

    function readFile(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

          /* grab first sheet */
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          /* save data */
          const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
          const firstCell: string = tmp[0][0];
          let tmpData: AOA;

          if (firstCell.startsWith('Empresa')) {
            tmpData = tmp;
            tmpData.splice(0, tmpData.findIndex((row) => row[0] === 'Cod. Producto') + 1);
            tmpData.splice(tmpData.findIndex((row) => row[0] === undefined));
          }

          resolve(tmpData);
        };
        reader.onerror = (err) => {
          console.error('Fallo al leer el archivo ', file.file.name, ' Error: ', err);
          reject(err);
        };
        reader.readAsBinaryString(file.file);
      });
    }

    const promises = Array.from(files, function(file: any) {
      return readFile(file)
        .then(function(data: AOA) {
          if (detalle) {
            detalle = [...detalle, ...data];
          } else {
            detalle = data;
          }
        });
    });

    return Promise.all(promises)
      .then(function() {
        return detalle;
      });
  }

  private agruparDetalle(detalle: AOA) {
    detalle = detalle.sort();
    const detAgrupado: AOA = new Array(detalle.shift());
    let codProducto: string = detAgrupado[0][this.coColProductoId];

    detalle.forEach((det) => {
      if (det[this.coColProductoId] === codProducto) {
        const index = detAgrupado.length - 1;
        const cantPedida = parseFloat(detAgrupado[index][this.coColCantPedida]);
        const KgPedidos = parseFloat(detAgrupado[index][this.coColKgPedidos]);

        detAgrupado[index][this.coColCantPedida] = cantPedida + parseFloat(det[this.coColCantPedida]);
        detAgrupado[index][this.coColKgPedidos] = KgPedidos + parseFloat(det[this.coColKgPedidos]);
      } else {
        codProducto = det[this.coColProductoId];
        detAgrupado.push(det);
      }
    });

    return detAgrupado;
  }

  private setCantidadAPedir(detalle: AOA) {
    const detalleModif: AOA = new Array();
    const coColMultiplicador = 3;
    const coColStockActual = 4;
    const coColCantAPedir = 5;
    const coColUnidadMedida = 6;
    const coColKgUnitario = 7;

    for (let i = 0; i < detalle.length; i++) {
      const det = new Array();

      det[this.coColProductoId] = detalle[i][this.coColProductoId];
      det[this.coColDescripcion] = detalle[i][this.coColDescripcion];
      det[this.coColCantPedida] = parseFloat(detalle[i][this.coColCantPedida]).toFixed(0);
      det[coColMultiplicador] = parseFloat(this.proveedorSel.multiplicador).toFixed(0);

      const stock = this.stock.find( elem => elem.productoId === detalle[i][this.coColProductoId]);
      const stockActual = (stock ? stock.stockActual : 0);
      det[coColStockActual] = parseFloat(stockActual).toFixed(0);

      const cantPedida = detalle[i][this.coColCantPedida] * this.proveedorSel.multiplicador;
      det[coColCantAPedir] = (cantPedida - stockActual).toFixed(0);
      det[coColUnidadMedida] = detalle[i][this.coColUnidadMedida];
      det[coColKgUnitario] = (detalle[i][this.coColKgPedidos] / detalle[i][this.coColCantPedida]).toFixed(4);

      detalleModif.push(det);
    }

    return detalleModif;
  }

  private confirmNextStep(): void {
    this.readMultipleFiles(this.internalFileModel)
      .then(async (det: AOA) => {
        let detalle = this.agruparDetalle(det);
        detalle = this.setCantidadAPedir(detalle);

        this.setSourceDataTable(detalle);
        this.steppers.next();
      })
      .catch((err) => {
        console.error('Ocurrio un error inesperado:', err);
      });
  }

  private sumKilogramos(detalle): any[] {
    let totalKg = 0;
    detalle.forEach((det) => totalKg = totalKg + parseFloat(det.kgPedidos));

    detalle.push({
      codProducto:   undefined,
      descripcion:   undefined,
      cantPedida:    undefined,
      unidadMedida:  undefined,
      cantReal:      undefined,
      kgReales:      undefined,
      kgPedidos:     totalKg,
      lote:          undefined
    });
    return detalle;
  }

  private setCabeceraWorkSheet(data: any[]): any[] {

    const cabecera = [
      {
        codProducto: 'Empresa:', descripcion: 'Ensemble SRL',
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', lote: ''
      },
      {
        codProducto: 'Deposito:', descripcion: 'Agrupado',
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', lote: ''
      },
      {
        codProducto: 'Fecha:', descripcion: new Date(),
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', lote: ''
      },
      {
        codProducto: 'Clasificacion:', descripcion: this.proveedorSel.nombre,
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', lote: ''
      },
      {
        codProducto: '', descripcion: '',
        cantPedida: '', unidadMedida: '', cantReal: '', kgReales: '', kgPedidos: '', lote: ''
      },
      {
        codProducto: 'Cod. Producto',
        descripcion: 'Descripcion',
        cantPedida: 'Cant. Pedida',
        unidadMedida: 'Unidad de Medida',
        cantReal: 'Cant. Real',
        kgReales: 'Kg. Reales',
        kgPedidos: 'Kg. Pedidos',
        lote: 'Lote'
      }
    ];

    data = [ ...cabecera, ...data];
    return data;
  }

  private formatWorkSheet(ws: XLSX.WorkSheet) {
    const range = ws['!ref'];
    const firstCell = range.substr(0, range.indexOf(':'));
    const lastCell = range.substr(range.indexOf(':') + 1);
    const firstChar = firstCell.charAt(0);
    const lastChar = lastCell.charAt(0);
    const firstNumber: number = parseInt(firstCell.substr(1), 10);
    const lastNumber: number = parseInt(lastCell.substr(1), 10);
    const firstNumberCabDet = 6; // Determina donde comienza la Cabecera del Detalle

    let abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    abc = abc.substr(abc.indexOf(firstChar));
    abc = abc.substr(0, abc.indexOf(lastChar) + 1);
    const arrChar = Array.from(abc);

    // IMPORTANT: Not implemented in XLSXStyle
    const wsCols: any[] = [];
    const wsRows: any[] = [];
    wsRows.push({ hpt: 15.75 });
    for (let i = firstNumber; i < lastNumber; i++) {
      wsRows.push({ hpt: 30 });
    }
    ws['!rows'] = wsRows;

    // format data
    arrChar.forEach((element) => {
      let maxChars = 6;

      for (let i = firstNumber; i <= lastNumber; i++) {
        // Si es undefined lo pongo '' (vacio)
        ws[`${element}${i}`].v = (ws[`${element}${i}`].v === undefined ? '' : ws[`${element}${i}`].v);
        // Busco el valor con mas caracteres
        maxChars = (ws[`${element}${i}`].v.length > maxChars ? ws[`${element}${i}`].v.length : maxChars);

        // Datos antes de Cabecera del Detalle
        if (i < firstNumberCabDet) {
          ws[`${element}${i}`].s = {
            font: {sz: 14, bold: true}
          };
        } else {
            // por defecto para todas las celdas
            ws[`${element}${i}`].t = 's';
            ws[`${element}${i}`].s = { font: {sz: 12} };

            // formato para el ultimo registro
            if (i === lastNumber) {
              ws[`${element}${i}`].s.font.bold = true;
            } else {
              ws[`${element}${i}`].s.border = {
                top: {style: 'thin', color: {auto: 1}},
                bottom: {style: 'thin', color: {auto: 1}},
                left: {style: 'thin', color: {auto: 1}},
                right: {style: 'thin', color: {auto: 1}}
              };
            }

            // formato cabecera del detalle
            if (i === firstNumberCabDet) {
              ws[`${element}${i}`].s['fill'] = {
                bgColor: {indexed: 64},
                fgColor: {rgb: '00000000'},
                patternType: 'solid'
              };
              ws[`${element}${i}`].s['font']['color'] = {rgb: 'FFFFFF'};
              ws[`${element}${i}`].s['font']['bold'] = true;
              ws[`${element}${i}`].s['alignment'] = {horizontal: 'center'};
            }

            if (!isNaN(ws[`${element}${i}`].v) && element !== firstChar) {
              ws[`${element}${i}`].t = 'n';
              ws[`${element}${i}`].s['numFmt'] = '0.0000';
            }
        }
      }

      // Agrego el ancho columna
      wsCols.push({ wch: maxChars + 2 });
    });

    ws['!cols'] = wsCols;
  }

  protected exportFile() {
    this.sourceDataTableExport.getAll()
      .then((data) => {
        swal({
          title: 'Esta Seguro?',
          text: 'Desea exportar los datos seleccionados?',
          type: 'question',
          showCancelButton: true,
          confirmButtonText: 'Exportar',
          cancelButtonText: 'Cancelar',
          showLoaderOnConfirm: true,
          preConfirm: () => {
            return new Promise((resolve) => {
              this.steppers.next();

              setTimeout(() => {
                /* generate worksheet */
                data = this.sumKilogramos(data);
                data = this.setCabeceraWorkSheet(data);

                const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
                this.formatWorkSheet(ws);

                /* generate workbook and add the worksheet */
                const wb: XLSX.WorkBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

                /* save to file */
                // XLSX.writeFile(wb, this.fileName,  { cellStyles: true });
                const wbout = XLSXStyle.write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary' });

                function s2ab(s) {
                  const buf = new ArrayBuffer(s.length);
                  const view = new Uint8Array(buf);
                  for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF; }
                  return buf;
                }

                saveAs(new Blob([s2ab(wbout)], { type: '' }), this.fileName);

                resolve();
              }, 1000);
            });
          },
          allowOutsideClick: () => !swal.isLoading()
        }).then((result) => {
          if (result.value) {
            swal({
              title: 'Agrupado',
              text: 'Los pedidos se agruparon con exito.',
              type: 'success',
            }).then( async () => {
              await this.dataService.refreshALoBruto(['/agrupar-pedidos']);
            });
          }
        });
      });
  }

  // eventos para inputFile pedidos
  public onAcceptPedido(file: any): void {
    console.log('accept pedido');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
      const proveedorCell: string = tmp[3][1];

      if (proveedorCell.toUpperCase() !== this.proveedorSel.nombre.toUpperCase()) {
        this.internalFileErrors.push(file);
      } else {
        this.internalFileModel.push(file);
      }
    };

    reader.readAsBinaryString(file.file);
  }

  public onRemovePedido(file: any): void {
    console.log('remove');
    const indexFileModel = this.internalFileModel.indexOf(file);
    const indexFileError = this.internalFileErrors.indexOf(file);

    if (indexFileModel !== -1) { this.internalFileModel.splice(indexFileModel, 1); }
    if (indexFileError !== -1) { this.internalFileErrors.splice(indexFileError, 1); }
  }

  public onLimitPedido(): void {
    console.log('limit');
    swal({
      type: 'info',
      title: 'Limite',
      text: `Solo se pueden cargar hasta ${this.inputMaxFiles} archivos!`
    });
  }

  public onRejectPedido(): void {
    console.log('reject');
    swal({
      type: 'warning',
      title: 'Archivo Invalido',
      html: `Solo se pueden cargar archivos con extension <b>${this.inputAccept}</b>!`
    });
  }

  // metodos Stepper
  public previousStepSelProveedor(): void {
    this.dataService.refreshALoBruto(['/agrupar-pedidos']).then();
  }

  public previousStepSelFiles(): void {
    this.steppers.back();
  }

  public nextStepFile(): void {
    if (this.proveedorSel) {
      this.steppers.next();
    } else {
      this.steppers.error('Debe seleccionar un proveedor');
    }
  }

  public nextStepSetCantAPedir(): void {
    if (this.internalFileErrors.length > 0) {
      let nameFiles = '<ul>';
      for (let i = 0; i < this.internalFileErrors.length; i++) {
        nameFiles = nameFiles + `<li><b>${this.internalFileErrors[i].file.name}</b></li>`;
      }
      nameFiles = nameFiles + '</ul>';

      swal({
        type: 'error',
        title: 'Archivos invalidos',
        html: `<p>Los siguientes archivos no pertenecen al proveedor seleccionado:<p>
              ${nameFiles}
              Debe quitarlos para poder seguir adelante.`,
      });

      return;
    }

    if (this.internalFileModel.length > 1) {
      this.steppers.clearError();

      if (this.internalFileModel.length !== this.usuario.cantFilesLoad) {
        swal({
          title: 'Esta Seguro?',
          text: `Deberian ser ${this.usuario.cantFilesLoad} pedidos para este Deposito. Desea seguir adelante de todas formas?`,
          type: 'question',
          showCancelButton: true,
          cancelButtonText: 'No',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          if (result.value) {
            this.confirmNextStep();
          }
        });
      } else {
        this.confirmNextStep();
      }
    } else {
      this.steppers.error('Debe seleccionar al menos 2 pedidos');
    }
  }

  public nextStepSetDataTableExport() {
    this.sourceDataTable.getAll()
      .then( data => {
        const detDataTable: any[] = [];

        data.forEach( det => {
          if (det.cantAPedir > 0) {
            const regTable: any = {};

            regTable['codProducto'] = det.codProducto;
            regTable['descripcion'] = det.descripcion;
            regTable['cantPedida'] = det.cantAPedir;
            regTable['unidadMedida'] = det.unidadMedida;
            regTable['cantReal'] = '';
            regTable['kgReales'] = '';
            regTable['kgPedidos'] = (det.cantAPedir * det.kgUnitario).toFixed(4);
            regTable['lote'] = '';

            detDataTable.push(regTable);
          }
        })

        this.sourceDataTableExport = new LocalDataSource(detDataTable);
        this.steppers.next();
      });
  }

  // metodos DataTable
  private setSourceDataTable(detalle: AOA) {
    const keys = Object.keys(this.columns);
    const detDataTable: any[] = [];

    for (let i = 0; i < detalle.length; i++) {
      const row = detalle[i];
      const regTable: any = {};

      for (let j = 0; j < row.length; j++) {
        regTable[keys[j]] = row[j];
      }

      detDataTable.push(regTable);
    }

    this.sourceDataTable = new LocalDataSource(detDataTable);
  }

  public checkUpdateRowDataTable(event: any) {
    const cantPedida = event.newData.cantAPedir;
    const valid: boolean = (cantPedida && cantPedida !== '' && !isNaN(cantPedida) && (cantPedida % 1 === 0) && (cantPedida > 0));

    if (valid) {
      event.newData.cantAPedir = parseFloat(cantPedida).toFixed(0);
      this.sourceDataTable.update(event.data, event.newData)
        .then(() => {
          this.sourceDataTable.refresh();
          event.confirm.resolve();
        });
    } else {
      swal(
        'Error',
        'Debe ingresar un número entero mayor a 0.',
        'error'
      );
      event.confirm.reject();
    }
  }

  // metodos SelProveedor
  public SelectProveedor(proveedor: any) {
    this.proveedorSel = proveedor;

    const optFormatDate = {year: 'numeric', month: '2-digit', day: '2-digit'};
    let strDateFile = new Date().toLocaleDateString('es-AR', optFormatDate);
    strDateFile = strDateFile.replace('/', '.');
    strDateFile = strDateFile.replace('/', '.');

    this.fileName = `Agrupado - ${this.proveedorSel.nombre} - ${strDateFile}.xlsx`;
  }

}
